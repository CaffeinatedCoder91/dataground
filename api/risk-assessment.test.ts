import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from './risk-assessment.js';

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

interface RiskAssessmentResponseData {
  assessment: {
    postcode: string;
    overallRating: 'Incomplete' | 'Low' | 'Medium' | 'High' | 'Critical';
    summary: string;
    riskBreakdown: {
      flood: string;
      subsidence: string;
    };
  };
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

const mockSuccessfulSourceFetches = () => {
  vi.stubGlobal('fetch', vi.fn((url: string | URL | Request) => {
    const urlText = String(url);
    if (urlText.includes('flood-map-for-planning-flood-zones')) {
      return Promise.resolve(Response.json({ features: [] }));
    }

    if (urlText.includes('BGS_Detailed_Geology')) {
      return Promise.resolve(Response.json({
      type: 'FeatureCollection',
      features: [
        {
          properties: {
            LEX_D: 'London Clay Formation',
            RCS_D: 'Clay',
          },
        },
      ],
      }));
    }

    return Promise.resolve(Response.json({}));
  }));
};

describe('riskAssessmentHandler', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    anthropicMessagesCreate.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
            overallRating: 'Medium',
            summary: 'Low to medium risk area.',
            riskBreakdown: {
              flood: 'No designated flood zone was identified.',
              subsidence: 'BGS geology data was available.',
            },
          }),
        },
      ],
    };

    anthropicMessagesCreate.mockResolvedValue(claudeMessageResponse);
    mockSuccessfulSourceFetches();

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
    expect(data.data?.assessment).toEqual({
      postcode: 'SW1A1AA',
      overallRating: 'Medium',
      summary: 'Low to medium risk area.',
      riskBreakdown: {
        flood: 'No designated flood zone was identified.',
        subsidence: 'BGS geology data was available.',
      },
    });
  });

  it('returns the correct JSON shape with null data and error string on Claude failure', async () => {
    anthropicMessagesCreate.mockRejectedValue(new Error('Claude API error'));
    mockSuccessfulSourceFetches();

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
            overallRating: 'Medium',
            summary: 'Low to medium risk area.',
            riskBreakdown: {
              flood: 'No designated flood zone was identified.',
              subsidence: 'BGS geology data was available.',
            },
          }),
        },
      ],
    };

    anthropicMessagesCreate.mockResolvedValue(claudeMessageResponse);
    mockSuccessfulSourceFetches();

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
