// @ts-expect-error Vercel provides these handler types in the deployment runtime.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { CLAUDE_MODEL, MAX_TOKENS } from './config.js';
import { buildRealDataRiskPrompt } from './prompts/realDataRiskPrompt.js';
import { buildRiskContext } from '../src/services/reportBuilder.js';
import {
  FIRST_FORWARDED_ADDRESS_INDEX,
  FIRST_CLAUDE_MESSAGE_CONTENT_INDEX,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  MIN_REQUIRED_TEXT_LENGTH,
  RATE_LIMIT_INITIAL_REQUEST_COUNT,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_UNKNOWN_ADDRESS_KEY,
  RATE_LIMIT_WINDOW_MS,
} from '../src/constants/index.js';
import type {
  FloodRiskData,
  GeologyData,
  RiskAssessment,
  RiskPayload,
  SubsidenceRisk,
} from '../src/types/index.js';

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

interface RequestEntry {
  count: number;
  timestamp: number;
}

interface ClaudeMessageResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

const requestCountMap = new Map<string, RequestEntry>();
const execFileAsync = promisify(execFile);

const EA_FLOOD_FEATURES_URL = 'https://environment.data.gov.uk/spatialdata/flood-map-for-planning-flood-zones/ogc/features/v1/collections/Flood_Zones_2_3_Rivers_and_Sea/items';
const BGS_WMS_URL = 'https://map.bgs.ac.uk/arcgis/services/BGS_Detailed_Geology/MapServer/WmsServer';
const BGS_SUPERFICIAL_LAYER = 'BGS.50k.Superficial.deposits';
const FLOOD_FETCH_TIMEOUT_MS = 5000;
const GEOLOGY_FETCH_TIMEOUT_MS = 8000;
const CLAUDE_REQUEST_TIMEOUT_MS = 18000;
const FLOOD_HARD_TIMEOUT_MS = 7000;
const GEOLOGY_HARD_TIMEOUT_MS = 10000;

// Guarantees an operation settles within timeoutMs even if the underlying
// fetch/abort never resolves (observed on the deployed nodejs runtime).
const withHardTimeout = <T>(
  operation: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> => {
  return Promise.race([
    operation,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
};

const riskAssessmentRequestSchema = z.object({
  postcode: z.string().min(MIN_REQUIRED_TEXT_LENGTH),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  region: z.string().optional().default(''),
});

const riskBreakdownSchema = z.object({
  flood: z.string().min(MIN_REQUIRED_TEXT_LENGTH),
  subsidence: z.string().min(MIN_REQUIRED_TEXT_LENGTH),
});

const claudeRiskResponseSchema = z.object({
  overallRating: z.enum(['Low', 'Medium', 'High', 'Critical']),
  summary: z.string().min(MIN_REQUIRED_TEXT_LENGTH),
  riskBreakdown: riskBreakdownSchema,
});

const riskAssessmentResponseSchema = claudeRiskResponseSchema.extend({
  postcode: z.string().min(MIN_REQUIRED_TEXT_LENGTH),
});

const floodFeatureSchema = z.object({
  properties: z.object({
    flood_zone: z.string().optional(),
  }).optional(),
}).passthrough();

const floodFeatureCollectionSchema = z.object({
  features: z.array(floodFeatureSchema),
});

const bgsFeatureSchema = z.object({
  properties: z.object({
    LEX_D: z.string().optional(),
    RCS_D: z.string().optional(),
  }).optional(),
});

const bgsFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection').optional(),
  features: z.array(bgsFeatureSchema).optional(),
});

type RiskAssessmentRequest = z.infer<typeof riskAssessmentRequestSchema>;
type FloodFeatureCollection = z.infer<typeof floodFeatureCollectionSchema>;

const emptyFloodRiskData = (error: string | null = null): FloodRiskData => ({
  available: error === null,
  source: 'Environment Agency',
  zone: null,
  severity: null,
  warnings: [],
  error,
});

const emptyGeologyData = (error: string | null = null): GeologyData => ({
  available: error === null,
  source: 'British Geological Survey',
  formation: null,
  subsidenceRisk: 'Unknown',
  disclaimer: 'Based on BGS 1:625k superficial geology - indicative only',
  error,
});

const getClientAddress = (request: VercelRequest): string => {
  const headers = request.headers as any;
  const getHeader = (name: string): string | null => {
    if (typeof headers.get === 'function') {
      return headers.get(name);
    }
    return headers[name] || null;
  };

  const forwardedFor = getHeader('x-forwarded-for');
  if (forwardedFor) {
    const forwardedAddresses = forwardedFor.split(',');
    return forwardedAddresses[FIRST_FORWARDED_ADDRESS_INDEX].trim();
  }

  const realAddress = getHeader('x-real-ip');
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

const parseJsonText = <T>(
  text: string,
  schema: z.ZodType<T>,
  errorMessage: string
): Promise<OperationResult<T>> => {
  return Promise.resolve()
    .then(() => JSON.parse(text))
    .then<OperationResult<T>, OperationResult<T>>(
      (jsonData) => {
        const validationResult = schema.safeParse(jsonData);
        if (!validationResult.success) {
          return { data: null, error: errorMessage };
        }

        return { data: validationResult.data, error: null };
      },
      () => ({ data: null, error: errorMessage })
    );
};

const parseRequest = async (request: VercelRequest): Promise<OperationResult<RiskAssessmentRequest>> => {
  const requestBody = request.body;

  if (requestBody === undefined || requestBody === null) {
    return { data: null, error: 'Invalid request body' };
  }

  if (typeof requestBody === 'string') {
    return await parseJsonText(requestBody, riskAssessmentRequestSchema, 'Invalid request body');
  }

  const validationResult = riskAssessmentRequestSchema.safeParse(requestBody);
  if (!validationResult.success) {
    return { data: null, error: 'Invalid request body' };
  }

  return { data: validationResult.data, error: null };
};

const fetchWithTimeout = async (
  url: string,
  timeoutMs: number,
  body?: string
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestBody = body ? new URLSearchParams({ data: body }).toString() : undefined;

  try {
    return await fetch(url, {
      method: requestBody ? 'POST' : 'GET',
      headers: requestBody
        ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        : undefined,
      body: requestBody,
      signal: controller.signal,
    });
  } catch {
    const curlArgs = [
      '--fail',
      '--silent',
      '--show-error',
      '--max-time',
      String(Math.ceil(timeoutMs / 1000)),
    ];

    if (requestBody) {
      curlArgs.push(
        '--request',
        'POST',
        '--header',
        'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
        '--data',
        requestBody
      );
    }

    curlArgs.push(url);

    const { stdout } = await execFileAsync('curl', curlArgs);
    return new Response(stdout, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const parseResponse = async <T>(
  response: Response,
  schema: z.ZodType<T>,
  errorMessage: string
): Promise<OperationResult<T>> => {
  const responseTextResult = await response.text().then<OperationResult<string>, OperationResult<string>>(
    (responseText) => ({ data: responseText, error: null }),
    () => ({ data: null, error: errorMessage })
  );

  if (!responseTextResult.data) {
    return { data: null, error: responseTextResult.error };
  }

  return await parseJsonText(responseTextResult.data, schema, errorMessage);
};

const buildFloodFeaturesUrl = (
  latitude: number,
  longitude: number
): string => {
  const bbox = `${longitude - 0.001},${latitude - 0.001},${longitude + 0.001},${latitude + 0.001}`;
  const url = new URL(EA_FLOOD_FEATURES_URL);
  url.search = new URLSearchParams({
    f: 'application/json',
    bbox,
    limit: '20',
  }).toString();
  return url.toString();
};

const fetchFloodFeatures = async (
  latitude: number,
  longitude: number
): Promise<OperationResult<FloodFeatureCollection>> => {
  const responseResult = await fetchWithTimeout(
    buildFloodFeaturesUrl(latitude, longitude),
    FLOOD_FETCH_TIMEOUT_MS
  ).then<OperationResult<Response>, OperationResult<Response>>(
    (response) => ({ data: response, error: null }),
    () => ({ data: null, error: 'Environment Agency flood data is unavailable right now.' })
  );

  if (!responseResult.data) {
    return { data: null, error: responseResult.error };
  }

  if (!responseResult.data.ok) {
    return { data: null, error: 'Environment Agency flood data is unavailable right now.' };
  }

  return parseResponse(responseResult.data, floodFeatureCollectionSchema, 'Environment Agency flood data could not be read.');
};

const getHighestFloodZone = (features: FloodFeatureCollection['features']): 2 | 3 | null => {
  let highestZone: 2 | 3 | null = null;

  for (const feature of features) {
    const floodZone = feature.properties?.flood_zone?.toUpperCase();
    if (floodZone === 'FZ3') {
      return 3;
    }

    if (floodZone === 'FZ2') {
      highestZone = 2;
    }
  }

  return highestZone;
};

const fetchFloodRisk = async (
  latitude: number,
  longitude: number
): Promise<FloodRiskData> => {
  const floodFeaturesResult = await fetchFloodFeatures(latitude, longitude);
  if (!floodFeaturesResult.data) {
    return emptyFloodRiskData(floodFeaturesResult.error);
  }

  const highestFloodZone = getHighestFloodZone(floodFeaturesResult.data.features);
  if (highestFloodZone) {
    return {
      available: true,
      source: 'Environment Agency',
      zone: `Zone ${highestFloodZone}`,
      severity: highestFloodZone,
      warnings: [],
      error: null,
    };
  }

  return emptyFloodRiskData();
};

const buildBgsUrl = (latitude: number, longitude: number): string => {
  const bbox = `${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}`;
  const url = new URL(BGS_WMS_URL);
  url.search = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    LAYERS: BGS_SUPERFICIAL_LAYER,
    QUERY_LAYERS: BGS_SUPERFICIAL_LAYER,
    CRS: 'CRS:84',
    BBOX: bbox,
    WIDTH: '101',
    HEIGHT: '101',
    I: '50',
    J: '50',
    INFO_FORMAT: 'application/geo+json',
  }).toString();
  return url.toString();
};

const lexToSubsidenceRisk = (lexValue: string | undefined): SubsidenceRisk => {
  if (!lexValue) return 'Unknown';
  const upperLexValue = lexValue.toUpperCase();
  if (upperLexValue.includes('CLAY')) return 'High';
  if (upperLexValue.includes('ALLUVIUM')) return 'Medium';
  if (upperLexValue.includes('CHALK')) return 'Low';
  if (upperLexValue.includes('LIMESTONE')) return 'Low';
  if (upperLexValue.includes('SANDSTONE')) return 'Low';
  return 'Unknown';
};

const fetchGeologyRisk = async (
  latitude: number,
  longitude: number
): Promise<GeologyData> => {
  const responseResult = await fetchWithTimeout(
    buildBgsUrl(latitude, longitude),
    GEOLOGY_FETCH_TIMEOUT_MS
  ).then<OperationResult<Response>, OperationResult<Response>>(
    (response) => ({ data: response, error: null }),
    () => ({ data: null, error: 'British Geological Survey data is unavailable right now.' })
  );

  if (!responseResult.data) {
    return emptyGeologyData(responseResult.error);
  }

  if (responseResult.data.status === 400) {
    return emptyGeologyData('British Geological Survey rejected the geology request.');
  }

  if (!responseResult.data.ok) {
    return emptyGeologyData('British Geological Survey data is unavailable right now.');
  }

  const dataResult = await parseResponse(responseResult.data, bgsFeatureCollectionSchema, 'British Geological Survey data could not be read.');
  if (!dataResult.data) {
    return emptyGeologyData(dataResult.error);
  }

  const features = dataResult.data.features || [];
  if (features.length === 0) {
    return emptyGeologyData();
  }

  const primaryFeature = features[0];
  const properties = primaryFeature.properties || {};
  const lexDescription = properties.LEX_D;
  const rockDescription = properties.RCS_D;

  return {
    available: true,
    source: 'British Geological Survey',
    formation: rockDescription || lexDescription || null,
    subsidenceRisk: lexToSubsidenceRisk(lexDescription),
    disclaimer: 'Based on BGS 1:625k superficial geology - indicative only',
    error: null,
  };
};

const getSettledData = <T>(
  result: PromiseSettledResult<T>,
  fallback: T
): T => result.status === 'fulfilled' ? result.value : fallback;

const buildIncompleteAssessment = (
  postcode: string,
  floodData: FloodRiskData,
  geologyData: GeologyData
): RiskAssessment => {
  const unavailableSources = [
    floodData.available ? null : 'Environment Agency flood data',
    geologyData.available ? null : 'British Geological Survey geology data',
  ].filter((sourceName): sourceName is string => sourceName !== null);

  return {
    postcode,
    overallRating: 'Incomplete',
    summary: `Risk rating is incomplete because ${unavailableSources.join(', ')} ${unavailableSources.length === 1 ? 'is' : 'are'} unavailable. Available source results are shown below, but no Low/Medium/High/Critical rating has been assigned.`,
    riskBreakdown: {
      flood: floodData.available
        ? floodData.zone
          ? `Environment Agency data places this location in ${floodData.zone}.`
          : 'Environment Agency data is available and does not identify this location as Flood Zone 2 or 3.'
        : floodData.error || 'Environment Agency flood data is unavailable.',
      subsidence: geologyData.available
        ? `British Geological Survey data identifies ${geologyData.formation || 'an unknown superficial deposit'} with ${geologyData.subsidenceRisk.toLowerCase()} subsidence risk.`
        : geologyData.error || 'British Geological Survey geology data is unavailable.',
    },
  };
};

const parseClaudeResponse = async (responseText: string, postcode: string): Promise<OperationResult<RiskAssessment>> => {
  const claudeResult = await parseJsonText(responseText, claudeRiskResponseSchema, 'Failed to generate risk assessment');
  if (!claudeResult.data) {
    return { data: null, error: claudeResult.error };
  }

  const validationResult = riskAssessmentResponseSchema.safeParse({
    postcode,
    ...claudeResult.data,
  });

  if (!validationResult.success) {
    console.error('Risk assessment validation error:', validationResult.error);
    return { data: null, error: 'Failed to generate risk assessment' };
  }

  return { data: validationResult.data, error: null };
};

const callClaudeMessagesApi = async (
  apiKey: string,
  prompt: string
): Promise<OperationResult<ClaudeMessageResponse>> => {
  const model = CLAUDE_MODEL;
  const max_tokens = MAX_TOKENS;
  const messages = [
    {
      role: 'user',
      content: prompt,
    },
  ];
  const system = undefined;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Anthropic request timed out')), CLAUDE_REQUEST_TIMEOUT_MS)
  );

  return await Promise.resolve()
    .then(async () => {
      const response = await Promise.race([
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ model, max_tokens, messages, system }),
        }),
        timeoutPromise,
      ]) as Response;

      if (!response.ok) {
        console.error('Anthropic API error status:', response.status);
        return { data: null, error: 'Failed to generate risk assessment' };
      }

      const message = await response.json() as ClaudeMessageResponse;
      return { data: message, error: null };
    })
    .then<OperationResult<ClaudeMessageResponse>, OperationResult<ClaudeMessageResponse>>(
      (message) => message,
      (error) => ({ data: null, error: error?.message ?? 'Failed to generate risk assessment' })
    );
};

const handleRiskAssessment = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  const clientAddress = getClientAddress(req);
  if (!isRequestAllowed(clientAddress)) {
    res.status(HTTP_STATUS_TOO_MANY_REQUESTS).json(
      { data: null, error: 'Too many requests. Please wait a moment and try again.' }
    );
    return;
  }

  const bodyResult = await parseRequest(req);
  if (!bodyResult.data) {
    res.status(HTTP_STATUS_BAD_REQUEST).json(
      { data: null, error: bodyResult.error || 'Invalid request body' }
    );
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json(
      { data: null, error: 'API key not configured' }
    );
    return;
  }

  const body = bodyResult.data;
  const sourceResults = await Promise.allSettled([
    withHardTimeout(
      fetchFloodRisk(body.latitude, body.longitude),
      FLOOD_HARD_TIMEOUT_MS,
      emptyFloodRiskData('Environment Agency flood data timed out.')
    ),
    withHardTimeout(
      fetchGeologyRisk(body.latitude, body.longitude),
      GEOLOGY_HARD_TIMEOUT_MS,
      emptyGeologyData('British Geological Survey data timed out.')
    ),
  ]);

  const floodData = getSettledData(sourceResults[0], emptyFloodRiskData('Environment Agency flood data is unavailable right now.'));
  const geologyData = getSettledData(sourceResults[1], emptyGeologyData('British Geological Survey data is unavailable right now.'));

  const payload: RiskPayload = {
    postcode: body.postcode,
    latitude: body.latitude,
    longitude: body.longitude,
    flood: floodData,
    geology: geologyData,
  };

  if (!floodData.available || !geologyData.available) {
    res.status(200).json({
      data: {
        assessment: buildIncompleteAssessment(body.postcode, floodData, geologyData),
        floodData,
        geologyData,
      },
      error: null,
    });
    return;
  }

  const prompt = buildRealDataRiskPrompt(buildRiskContext(payload));
  const messageResult = await callClaudeMessagesApi(apiKey, prompt);

  if (!messageResult.data) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json(
      { data: null, error: messageResult.error || 'Failed to generate risk assessment' }
    );
    return;
  }

  if (!('content' in messageResult.data)) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json(
      { data: null, error: 'Failed to generate risk assessment' }
    );
    return;
  }

  const firstContentBlock = messageResult.data.content[FIRST_CLAUDE_MESSAGE_CONTENT_INDEX];
  const responseText =
    firstContentBlock.type === 'text'
      ? firstContentBlock.text
      : '';

  const assessmentResult = await parseClaudeResponse(responseText, body.postcode);
  if (!assessmentResult.data) {
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json(
      { data: null, error: assessmentResult.error || 'Failed to generate risk assessment' }
    );
    return;
  }

  res.status(200).json({
    data: {
      assessment: assessmentResult.data,
      floodData,
      geologyData,
    },
    error: null,
  });
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleRiskAssessment(req, res);
}
