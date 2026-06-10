import { Anthropic } from '@anthropic-ai/sdk';
import { CLAUDE_MODEL, MAX_TOKENS } from './config';
import { RISK_LEVEL, type RiskAssessment, type RiskLevel } from '../src/types';

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

const isRiskLevel = (value: unknown): value is RiskLevel =>
  value === RISK_LEVEL.LOW || value === RISK_LEVEL.MEDIUM || value === RISK_LEVEL.HIGH;

const parseRiskScore = (value: unknown): RiskAssessment['floodRisk'] => {
  if (!isRecord(value) || !isRiskLevel(value.level) || typeof value.score !== 'number') {
    throw new Error('INVALID_RESPONSE');
  }

  return {
    level: value.level,
    score: value.score,
  };
};

const parseRiskAssessment = (value: unknown, postcode: string): RiskAssessment => {
  if (!isRecord(value)) {
    throw new Error('INVALID_RESPONSE');
  }

  const keyFactors = value.keyFactors;

  if (
    typeof value.overallScore !== 'number' ||
    typeof value.summary !== 'string' ||
    !Array.isArray(keyFactors) ||
    !keyFactors.every((factor) => typeof factor === 'string')
  ) {
    throw new Error('INVALID_RESPONSE');
  }

  return {
    postcode,
    floodRisk: parseRiskScore(value.floodRisk),
    fireRisk: parseRiskScore(value.fireRisk),
    subsidenceRisk: parseRiskScore(value.subsidenceRisk),
    overallScore: value.overallScore,
    keyFactors,
    summary: value.summary,
  };
};

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

    const assessment = parseRiskAssessment(JSON.parse(responseText), body.postcode);

    return Response.json({ data: assessment, error: null });
  } catch (error) {
    console.error('Risk assessment error:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json(
      { data: null, error: 'Failed to generate risk assessment' },
      { status: 500 }
    );
  }
}
