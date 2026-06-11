import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODEL, MAX_TOKENS } from './config';
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
  score: z.number().min(1).max(10),
});

const riskAssessmentResponseSchema = z.object({
  postcode: z.string().min(1),
  floodRisk: riskScoreSchema,
  fireRisk: riskScoreSchema,
  subsidenceRisk: riskScoreSchema,
  overallScore: z.number().min(1).max(10),
  summary: z.string().min(1),
  keyFactors: z.array(z.string()).length(3),
});

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return Response.json(
      { data: null, error: 'Method not allowed' },
      { status: 405 }
    );
  }

  let body: RiskAssessmentRequest;
  try {
    body = parseRiskAssessmentRequest(await request.json());
  } catch {
    return Response.json(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { data: null, error: 'API key not configured' },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  const prompt = `You are a property risk assessment expert. Analyse the following UK property location and provide a risk assessment for flood, fire, and subsidence risks.

Location details:
- Postcode: ${body.postcode}
- Region: ${body.region}
- Coordinates: ${body.latitude}, ${body.longitude}

Based on geographic and climatic knowledge of this area, provide a JSON response with the following exact structure (no other text):
{
    "floodRisk": {
    "level": "low" | "medium" | "high",
    "score": number between 1-10
  },
  "fireRisk": {
    "level": "low" | "medium" | "high",
    "score": number between 1-10
  },
  "subsidenceRisk": {
    "level": "low" | "medium" | "high",
    "score": number between 1-10
  },
  "overallScore": number between 1-10,
  "summary": "2-3 sentence summary of the overall risk profile",
  "keyFactors": ["factor 1", "factor 2", "factor 3"]
}

Respond with valid JSON only. No markdown, no code blocks, just the JSON object.`;

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

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
        { status: 500 }
      );
    }

    const assessment: RiskAssessment = validationResult.data;

    return Response.json({ data: assessment, error: null });
  } catch (error) {
    console.error('Risk assessment error:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json(
      { data: null, error: 'Failed to generate risk assessment' },
      { status: 500 }
    );
  }
}
