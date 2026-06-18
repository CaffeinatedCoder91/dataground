import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODEL, MAX_TOKENS } from './config.js';
import { buildRiskAssessmentPrompt } from './prompts/riskAssessmentPrompt.js';
import {
  CLAUDE_TEMPERATURE_DETERMINISTIC,
  FIRST_FORWARDED_ADDRESS_INDEX,
  FIRST_CLAUDE_MESSAGE_CONTENT_INDEX,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  KEY_FACTORS_COUNT,
  MAX_OVERALL_SCORE,
  MIN_OVERALL_SCORE,
  MIN_REQUIRED_TEXT_LENGTH,
  RATE_LIMIT_INITIAL_REQUEST_COUNT,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_UNKNOWN_ADDRESS_KEY,
  RATE_LIMIT_WINDOW_MS,
} from '../src/constants/index.js';
import { RISK_LEVEL, type RiskAssessment, type FloodRiskData } from '../src/types/index.js';

export const maxDuration = 30;

export const config = {
  runtime: 'nodejs',
};

interface RiskRequest {
  postcode: string;
  latitude: number;
  longitude: number;
  region: string;
}

interface RequestEntry {
  count: number;
  timestamp: number;
}

const requestCountMap = new Map<string, RequestEntry>();

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

const emptyFloodRiskData = (error: string | null = null): FloodRiskData => ({
  zone: null,
  severity: null,
  warnings: [],
  error,
});

const getClientAddress = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const forwardedAddresses = forwardedFor.split(',');
    return forwardedAddresses[FIRST_FORWARDED_ADDRESS_INDEX].trim();
  }

  const realAddress = request.headers.get('x-real-ip');
  if (realAddress) {
    return realAddress;
  }

  return RATE_LIMIT_UNKNOWN_ADDRESS_KEY;
};

const isRequestAllowed = (clientAddress: string): boolean => {
  const now = Date.now();
  const entry = requestCountMap.get(clientAddress);

  if (!entry) {
    requestCountMap.set(clientAddress, { count: RATE_LIMIT_INITIAL_REQUEST_COUNT, timestamp: now });
    return true;
  }

  const timeSinceFirstRequest = now - entry.timestamp;

  if (timeSinceFirstRequest > RATE_LIMIT_WINDOW_MS) {
    requestCountMap.set(clientAddress, { count: RATE_LIMIT_INITIAL_REQUEST_COUNT, timestamp: now });
    return true;
  }

  entry.count += 1;

  return entry.count <= RATE_LIMIT_MAX_REQUESTS;
};

const cleanupOldEntries = (): void => {
  const now = Date.now();

  for (const [clientAddress, entry] of requestCountMap.entries()) {
    const timeSinceFirstRequest = now - entry.timestamp;
    if (timeSinceFirstRequest > RATE_LIMIT_WINDOW_MS) {
      requestCountMap.delete(clientAddress);
    }
  }
};

const cleanupTimer = setInterval(cleanupOldEntries, RATE_LIMIT_WINDOW_MS);
if (
  typeof cleanupTimer === 'object' &&
  'unref' in cleanupTimer &&
  typeof cleanupTimer.unref === 'function'
) {
  cleanupTimer.unref();
}

const coordinateSchema = z.number().finite();

const riskRequestSchema = z.object({
  postcode: z.string().min(MIN_REQUIRED_TEXT_LENGTH),
  latitude: coordinateSchema.min(-90).max(90),
  longitude: coordinateSchema.min(-180).max(180),
  region: z.string().optional().default(''),
});

const parseRiskRequest = async (request: Request): Promise<OperationResult<RiskRequest>> => {
  return request.json().then(
    (body) => {
      const validationResult = riskRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return { data: null, error: 'Invalid request body' };
      }

      return { data: validationResult.data, error: null };
    },
    () => ({ data: null, error: 'Invalid request body' })
  );
};

const riskLevelSchema = z.enum([
  RISK_LEVEL.LOW,
  RISK_LEVEL.MEDIUM,
  RISK_LEVEL.HIGH,
]);

const riskScoreSchema = z.object({
  level: riskLevelSchema,
  score: z.number().min(MIN_OVERALL_SCORE).max(MAX_OVERALL_SCORE),
});

const riskAssessmentResponseSchema = z.object({
  postcode: z.string().min(MIN_REQUIRED_TEXT_LENGTH),
  floodRisk: riskScoreSchema,
  fireRisk: riskScoreSchema,
  subsidenceRisk: riskScoreSchema,
  overallScore: z.number().min(MIN_OVERALL_SCORE).max(MAX_OVERALL_SCORE),
  summary: z.string().min(MIN_REQUIRED_TEXT_LENGTH),
  keyFactors: z.array(z.string()).length(KEY_FACTORS_COUNT),
});

const positionSchema = z.array(z.number()).min(2);
const linearRingSchema = z.array(positionSchema);
const polygonCoordinatesSchema = z.array(linearRingSchema);
const multiPolygonCoordinatesSchema = z.array(polygonCoordinatesSchema);

const floodGeometrySchema = z.union([
  z.object({
    type: z.literal('Polygon'),
    coordinates: polygonCoordinatesSchema,
  }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: multiPolygonCoordinatesSchema,
  }),
]);

const floodPolygonSchema = z.object({
  type: z.literal('Feature'),
  geometry: floodGeometrySchema.nullable(),
});

const floodAreaResponseSchema = z.object({
  items: z.array(z.object({
    notation: z.string().optional(),
    label: z.string().optional(),
    polygon: floodPolygonSchema.nullish(),
  })).optional(),
});

const floodWarningResponseSchema = z.object({
  items: z.array(z.object({
    description: z.string().optional(),
    severityLevel: z.number().optional(),
    areaName: z.string().optional(),
  })).optional(),
});

type FloodAreaResponse = z.infer<typeof floodAreaResponseSchema>;
type FloodWarningResponse = z.infer<typeof floodWarningResponseSchema>;

const fetchFloodRisk = async (
  latitude: number,
  longitude: number
): Promise<FloodRiskData> => {
  const EA_FLOOD_AREAS_URL = 'https://environment.data.gov.uk/flood-monitoring/id/floodAreas';
  const EA_FLOOD_WARNINGS_URL = 'https://environment.data.gov.uk/flood-monitoring/api/floodAreas';
  const FETCH_TIMEOUT_MS = 5000;

  const fetchWithTimeout = async (url: string): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response: Response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const responseResult = await fetchWithTimeout(
    `${EA_FLOOD_AREAS_URL}?lat=${latitude}&long=${longitude}&_limit=5`
  ).then<OperationResult<Response>, OperationResult<Response>>(
    (response) => ({ data: response, error: null }),
    () => ({ data: null, error: 'Environment Agency flood data is unavailable right now.' })
  );

  if (!responseResult.data) {
    return emptyFloodRiskData(responseResult.error);
  }

  const response: Response = responseResult.data;
  if (!response.ok) {
    return emptyFloodRiskData('Environment Agency flood data is unavailable right now.');
  }

  const areaDataResult = await response.json().then<OperationResult<FloodAreaResponse>, OperationResult<FloodAreaResponse>>(
    (data) => {
      const validationResult = floodAreaResponseSchema.safeParse(data);
      if (!validationResult.success) {
        return { data: null, error: 'Environment Agency flood data could not be read.' };
      }

      return { data: validationResult.data, error: null };
    },
    () => ({ data: null, error: 'Environment Agency flood data could not be read.' })
  );

  if (!areaDataResult.data) {
    return emptyFloodRiskData(areaDataResult.error);
  }

  const items = areaDataResult.data.items || [];
  if (items.length === 0) {
    return emptyFloodRiskData();
  }

  const primaryArea = items[0];
  const notation = primaryArea.notation || '';
  const zone = primaryArea.label || null;

  let warnings: Array<{
    description: string;
    severity: number;
    areaName: string;
  }> = [];
  let severity: number | null = null;
  let floodError: string | null = null;

  if (notation) {
    const warningResponseResult = await fetchWithTimeout(
      `${EA_FLOOD_WARNINGS_URL}/${notation}`
    ).then<OperationResult<Response>, OperationResult<Response>>(
      (warningResponse) => ({ data: warningResponse, error: null }),
      () => ({ data: null, error: 'Environment Agency flood warnings are unavailable right now.' })
    );

    if (!warningResponseResult.data) {
      floodError = warningResponseResult.error;
    } else if (!warningResponseResult.data.ok) {
      floodError = 'Environment Agency flood warnings are unavailable right now.';
    } else {
      const warningDataResult = await warningResponseResult.data.json().then<OperationResult<FloodWarningResponse>, OperationResult<FloodWarningResponse>>(
        (warningData) => {
          const validationResult = floodWarningResponseSchema.safeParse(warningData);
          if (!validationResult.success) {
            return { data: null, error: 'Environment Agency flood warnings could not be read.' };
          }

          return { data: validationResult.data, error: null };
        },
        () => ({ data: null, error: 'Environment Agency flood warnings could not be read.' })
      );

      if (!warningDataResult.data) {
        floodError = warningDataResult.error;
      } else {
        const warningItems = warningDataResult.data.items || [];

        warnings = warningItems
          .filter((item) => item.description)
          .map((item) => ({
            description: item.description || '',
            severity: item.severityLevel || 0,
            areaName: item.areaName || zone || 'Flood Area',
          }));

        if (warningItems.length > 0 && warningItems[0].severityLevel) {
          severity = warningItems[0].severityLevel;
        }
      }
    }
  }

  const result: FloodRiskData = {
    zone,
    severity: severity || (zone ? 1 : null),
    warnings,
    error: floodError,
  };

  if (primaryArea.polygon?.geometry) {
    result.polygon = {
      type: 'Feature',
      geometry: primaryArea.polygon.geometry,
      properties: {},
    };
  }

  return result;
};

interface RiskResponseData {
  assessment: RiskAssessment;
  floodData: FloodRiskData;
}

async function POST(request: Request) {
  const clientAddress = getClientAddress(request);
  if (!isRequestAllowed(clientAddress)) {
    return Response.json(
      { data: null, error: 'Too many requests. Please wait a moment and try again.' },
      { status: HTTP_STATUS_TOO_MANY_REQUESTS }
    );
  }

  const bodyResult = await parseRiskRequest(request);
  if (!bodyResult.data) {
    return Response.json(
      { data: null, error: bodyResult.error },
      { status: HTTP_STATUS_BAD_REQUEST }
    );
  }
  const body = bodyResult.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { data: null, error: 'API key not configured' },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
    );
  }

  const client = new Anthropic({ apiKey });

  const prompt = buildRiskAssessmentPrompt(
    body.postcode,
    body.region,
    body.latitude,
    body.longitude
  );

  const assessmentResult = await Promise.all([
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: CLAUDE_TEMPERATURE_DETERMINISTIC,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      fetchFloodRisk(body.latitude, body.longitude),
    ]).then<OperationResult<RiskResponseData>, OperationResult<RiskResponseData>>(
      async ([message, floodData]) => {
        const responseText =
          message.content[FIRST_CLAUDE_MESSAGE_CONTENT_INDEX].type === 'text'
            ? message.content[FIRST_CLAUDE_MESSAGE_CONTENT_INDEX].text
            : '';

        const parsedResponse = await Promise.resolve()
          .then(() => JSON.parse(responseText))
          .then(
            (jsonData) => jsonData,
            () => null
          );

        const validationResult = riskAssessmentResponseSchema.safeParse({
          postcode: body.postcode,
          ...(parsedResponse && typeof parsedResponse === 'object' ? parsedResponse : {}),
        });

        if (!validationResult.success) {
          console.error('Risk assessment validation error:', validationResult.error);
          return { data: null, error: 'Failed to generate risk assessment' };
        }

        const assessment: RiskAssessment = validationResult.data;
        return {
          data: {
            assessment,
            floodData,
          },
          error: null,
        };
      },
      (error: Error) => {
        console.error('Risk assessment error:', error.message);
        return { data: null, error: 'Failed to generate risk assessment' };
      }
    );

  if (!assessmentResult.data) {
    return Response.json(
      { data: null, error: assessmentResult.error },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
    );
  }

  return Response.json({ data: assessmentResult.data, error: null });
}

export { POST };
export default POST;
