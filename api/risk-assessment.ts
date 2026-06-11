import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODEL, MAX_TOKENS } from './config';
import { buildRiskAssessmentPrompt } from './prompts/riskAssessmentPrompt';
import {
  CLAUDE_TEMPERATURE_DETERMINISTIC,
  FIRST_CLAUDE_MESSAGE_CONTENT_INDEX,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_METHOD_NOT_ALLOWED,
  KEY_FACTORS_COUNT,
  MAX_OVERALL_SCORE,
  MIN_OVERALL_SCORE,
  MIN_REQUIRED_TEXT_LENGTH,
} from '../src/constants';
import { RISK_LEVEL, type RiskAssessment } from '../src/types';

interface RiskAssessmentRequest {
  postcode: string;
  latitude: number;
  longitude: number;
  region: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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

  let body: RiskAssessmentRequest;
  try {
    body = parseRiskAssessmentRequest(await request.json());
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

    const parsedResponse = JSON.parse(responseText);
    const responseWithPostcode = {
      postcode: body.postcode,
      ...parsedResponse,
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
