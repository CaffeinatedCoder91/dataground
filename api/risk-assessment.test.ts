import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from './risk-assessment.js';

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

let requestId = 0;

const parseRiskAssessmentApiResponse = async (
  response: Response
): Promise<RiskAssessmentApiResponse> => {
  return response.json() as Promise<RiskAssessmentApiResponse>;
};

const callRiskAssessmentHandler = async (
  body: unknown
): Promise<Response> => {
  let statusCode = 200;
  let responseBody: unknown;
  const request = {
    headers: {
      'x-real-ip': `test-client-${requestId += 1}`,
    },
    body,
  };
  const response = {
    status(status: number) {
      statusCode = status;
      return {
        json(body: unknown) {
          responseBody = body;
        },
      };
    },
  };

  await handler(request as never, response as never);

  return Response.json(responseBody, { status: statusCode });
};

const mockSuccessfulFetches = (claudeMessageResponse: unknown) => {
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

    if (urlText.includes('api.anthropic.com/v1/messages')) {
      return Promise.resolve(Response.json(claudeMessageResponse));
    }

    return Promise.resolve(Response.json({}));
  }));
};

const mockFetchesWithClaudeFailure = () => {
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

    if (urlText.includes('api.anthropic.com/v1/messages')) {
      return Promise.resolve(Response.json(
        { error: { message: 'Claude API error' } },
        { status: 500 }
      ));
    }

    return Promise.resolve(Response.json({}));
  }));
};

describe('riskAssessmentHandler', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns 400 when postcode is missing from the request body', async () => {
    const response = await callRiskAssessmentHandler({
        latitude: 51.5034,
        longitude: -0.1276,
        region: 'Greater London',
      });
    const data = await parseRiskAssessmentApiResponse(response);

    expect(response.status).toBe(400);
    expect(data.data).toBeNull();
    expect(typeof data.error).toBe('string');
  });

  it('returns 400 when latitude is missing from the request body', async () => {
    const response = await callRiskAssessmentHandler({
        postcode: 'SW1A1AA',
        longitude: -0.1276,
        region: 'Greater London',
      });
    const data = await parseRiskAssessmentApiResponse(response);

    expect(response.status).toBe(400);
    expect(data.data).toBeNull();
    expect(typeof data.error).toBe('string');
  });

  it('returns 400 when longitude is missing from the request body', async () => {
    const response = await callRiskAssessmentHandler({
        postcode: 'SW1A1AA',
        latitude: 51.5034,
        region: 'Greater London',
      });
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

    mockSuccessfulFetches(claudeMessageResponse);

    const response = await callRiskAssessmentHandler({
        postcode: 'SW1A1AA',
        latitude: 51.5034,
        longitude: -0.1276,
        region: 'Greater London',
      });
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
    mockFetchesWithClaudeFailure();

    const response = await callRiskAssessmentHandler({
        postcode: 'SW1A1AA',
        latitude: 51.5034,
        longitude: -0.1276,
        region: 'Greater London',
      });
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

    mockSuccessfulFetches(claudeMessageResponse);

    const response = await callRiskAssessmentHandler({
        postcode: 'SW1A1AA',
        latitude: 51.5034,
        longitude: -0.1276,
        region: 'Greater London',
      });
    const responseText = await response.text();

    expect(responseText).not.toContain('ANTHROPIC_API_KEY');
    expect(responseText).not.toContain('test-key');
  });
});
