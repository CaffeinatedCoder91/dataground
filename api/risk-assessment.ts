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
  HTTP_STATUS_METHOD_NOT_ALLOWED,
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
import { RISK_LEVEL, type RiskAssessment } from '../src/types/index.js';

export const maxDuration = 30;

export const config = {
  runtime: 'nodejs',
};

interface RiskAssessmentRequest {
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

interface RequestWithJson {
  json: () => Promise<unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasJsonMethod = (value: unknown): value is RequestWithJson =>
  isRecord(value) && typeof value.json === 'function';

const getHeaderValue = (request: unknown, headerName: string): string | null => {
  if (!isRecord(request)) {
    return null;
  }

  const headers = request.headers;

  if (!isRecord(headers)) {
    return null;
  }

  // Handle Web API Headers object (Vercel runtime)
  if (typeof (headers as Record<string, unknown>).get === 'function') {
    const getMethod = (headers as Record<string, unknown>).get as (key: string) => string | null;
    return getMethod(headerName);
  }

  // Handle Node.js IncomingMessage plain object
  const headerValue = headers[headerName];
  if (typeof headerValue === 'string') {
    return headerValue;
  }

  if (
    Array.isArray(headerValue) &&
    typeof headerValue[FIRST_FORWARDED_ADDRESS_INDEX] === 'string'
  ) {
    return headerValue[FIRST_FORWARDED_ADDRESS_INDEX];
  }

  return null;
};

const getClientAddress = (request: unknown): string => {
  const forwardedFor = getHeaderValue(request, 'x-forwarded-for');
  if (forwardedFor) {
    const forwardedAddresses = forwardedFor.split(',');
    return forwardedAddresses[FIRST_FORWARDED_ADDRESS_INDEX].trim();
  }

  const realAddress = getHeaderValue(request, 'x-real-ip');
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

const parseRequestBody = async (request: unknown): Promise<unknown> => {
  if (hasJsonMethod(request)) {
    return request.json();
  }

  if (!isRecord(request)) {
    throw new Error('INVALID_REQUEST');
  }

  const requestBody = request.body;
  if (typeof requestBody === 'string') {
    const parsedBody: unknown = JSON.parse(requestBody);
    return parsedBody;
  }

  return requestBody;
};

const parseRiskAssessmentRequest = (value: unknown): RiskAssessmentRequest => {
  if (!isRecord(value)) {
    throw new Error('INVALID_REQUEST');
  }

  if (
    typeof value.postcode !== 'string' ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number'
  ) {
    throw new Error('INVALID_REQUEST');
  }

  return {
    postcode: value.postcode,
    latitude: value.latitude,
    longitude: value.longitude,
    region: typeof value.region === 'string' ? value.region : '',
  };
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

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return Response.json(
      { data: null, error: 'Method not allowed' },
      { status: HTTP_STATUS_METHOD_NOT_ALLOWED }
    );
  }

  const clientAddress = getClientAddress(request);
  if (!isRequestAllowed(clientAddress)) {
    return Response.json(
      { data: null, error: 'Too many requests. Please wait a moment and try again.' },
      { status: HTTP_STATUS_TOO_MANY_REQUESTS }
    );
  }

  let body: RiskAssessmentRequest;
  try {
    body = parseRiskAssessmentRequest(await parseRequestBody(request));
  } catch {
    return Response.json(
      { data: null, error: 'Invalid request body' },
      { status: HTTP_STATUS_BAD_REQUEST }
    );
  }

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

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: CLAUDE_TEMPERATURE_DETERMINISTIC,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[FIRST_CLAUDE_MESSAGE_CONTENT_INDEX].type === 'text'
        ? message.content[FIRST_CLAUDE_MESSAGE_CONTENT_INDEX].text
        : '';

    const parsedResponse: unknown = JSON.parse(responseText);
    const responseWithPostcode = {
      postcode: body.postcode,
      ...(isRecord(parsedResponse) ? parsedResponse : {}),
    };
    const validationResult = riskAssessmentResponseSchema.safeParse(responseWithPostcode);

    if (!validationResult.success) {
      console.error('Risk assessment validation error:', validationResult.error);
      return Response.json(
        { data: null, error: 'Failed to generate risk assessment' },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }

    const assessment: RiskAssessment = validationResult.data;

    return Response.json({ data: assessment, error: null });
  } catch (error) {
    console.error('Risk assessment error:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json(
      { data: null, error: 'Failed to generate risk assessment' },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
    );
  }
}
