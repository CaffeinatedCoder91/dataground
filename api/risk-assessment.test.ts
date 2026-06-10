import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from './risk-assessment';

const anthropicMessagesCreate = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(function AnthropicMock() {
    return {
      messages: {
        create: anthropicMessagesCreate,
      },
    };
  }),
}));

interface RiskScoreResponse {
  level: 'low' | 'medium' | 'high';
  score: number;
}

interface RiskAssessmentResponseData {
  postcode: string;
  floodRisk: RiskScoreResponse;
  fireRisk: RiskScoreResponse;
  subsidenceRisk: RiskScoreResponse;
  overallScore: number;
  summary: string;
  keyFactors: string[];
}

interface RiskAssessmentApiResponse {
  data: RiskAssessmentResponseData | null;
  error: string | null;
}

const parseRiskAssessmentApiResponse = async (
  response: Response
): Promise<RiskAssessmentApiResponse> => {
  return response.json() as Promise<RiskAssessmentApiResponse>;
};

describe('riskAssessmentHandler', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    anthropicMessagesCreate.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when postcode is missing from the request body', async () => {
    const request = new Request('http://localhost/api/risk-assessment', {
      method: 'POST',
      body: JSON.stringify({
        latitude: 51.5034,
        longitude: -0.1276,
        region: 'Greater London',
      }),
    });

    const response = await handler(request);
    const data = await parseRiskAssessmentApiResponse(response);

    expect(response.status).toBe(400);
    expect(data.data).toBeNull();
    expect(typeof data.error).toBe('string');
  });

  it('returns 400 when latitude is missing from the request body', async () => {
    const request = new Request('http://localhost/api/risk-assessment', {
      method: 'POST',
      body: JSON.stringify({
        postcode: 'SW1A1AA',
        longitude: -0.1276,
        region: 'Greater London',
      }),
    });

    const response = await handler(request);
    const data = await parseRiskAssessmentApiResponse(response);

    expect(response.status).toBe(400);
    expect(data.data).toBeNull();
    expect(typeof data.error).toBe('string');
  });

  it('returns 400 when longitude is missing from the request body', async () => {
    const request = new Request('http://localhost/api/risk-assessment', {
      method: 'POST',
      body: JSON.stringify({
        postcode: 'SW1A1AA',
        latitude: 51.5034,
        region: 'Greater London',
      }),
    });

    const response = await handler(request);
    const data = await parseRiskAssessmentApiResponse(response);

    expect(response.status).toBe(400);
    expect(data.data).toBeNull();
    expect(typeof data.error).toBe('string');
  });

  it('returns the correct JSON shape with data and null error on success', async () => {
    const claudeMessageResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            floodRisk: { level: 'low', score: 2 },
            fireRisk: { level: 'low', score: 2 },
            subsidenceRisk: { level: 'high', score: 8 },
            overallScore: 4,
            summary: 'Low to medium risk area.',
            keyFactors: ['Factor 1', 'Factor 2', 'Factor 3'],
          }),
        },
      ],
    };

    anthropicMessagesCreate.mockResolvedValue(claudeMessageResponse);

    const request = new Request('http://localhost/api/risk-assessment', {
      method: 'POST',
      body: JSON.stringify({
        postcode: 'SW1A1AA',
        latitude: 51.5034,
        longitude: -0.1276,
        region: 'Greater London',
      }),
    });

    const response = await handler(request);
    const data = await parseRiskAssessmentApiResponse(response);

    expect(response.status).toBe(200);
    expect(data.error).toBeNull();
    expect(data.data).toEqual({
      postcode: 'SW1A1AA',
      floodRisk: { level: 'low', score: 2 },
      fireRisk: { level: 'low', score: 2 },
      subsidenceRisk: { level: 'high', score: 8 },
      overallScore: 4,
      summary: 'Low to medium risk area.',
      keyFactors: ['Factor 1', 'Factor 2', 'Factor 3'],
    });
  });

  it('returns the correct JSON shape with null data and error string on Claude failure', async () => {
    anthropicMessagesCreate.mockRejectedValue(new Error('Claude API error'));

    const request = new Request('http://localhost/api/risk-assessment', {
      method: 'POST',
      body: JSON.stringify({
        postcode: 'SW1A1AA',
        latitude: 51.5034,
        longitude: -0.1276,
        region: 'Greater London',
      }),
    });

    const response = await handler(request);
    const data = await parseRiskAssessmentApiResponse(response);

    expect(response.status).toBe(500);
    expect(data.data).toBeNull();
    expect(typeof data.error).toBe('string');
  });

  it('never includes ANTHROPIC_API_KEY in the response', async () => {
    const claudeMessageResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            floodRisk: { level: 'low', score: 2 },
            fireRisk: { level: 'low', score: 2 },
            subsidenceRisk: { level: 'high', score: 8 },
            overallScore: 4,
            summary: 'Low to medium risk area.',
            keyFactors: ['Factor 1', 'Factor 2', 'Factor 3'],
          }),
        },
      ],
    };

    anthropicMessagesCreate.mockResolvedValue(claudeMessageResponse);

    const request = new Request('http://localhost/api/risk-assessment', {
      method: 'POST',
      body: JSON.stringify({
        postcode: 'SW1A1AA',
        latitude: 51.5034,
        longitude: -0.1276,
        region: 'Greater London',
      }),
    });

    const response = await handler(request);
    const responseText = await response.text();

    expect(responseText).not.toContain('ANTHROPIC_API_KEY');
    expect(responseText).not.toContain('test-key');
  });
});
