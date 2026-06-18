import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRiskAssessment } from './useRiskAssessment';
import type { PostcodeLocation, RiskAssessmentResult } from '../types';

describe('useRiskAssessment', () => {
  const mockLocation: PostcodeLocation = {
    postcode: 'SW1A1AA',
    latitude: 51.5034,
    longitude: -0.1276,
    area: 'St James',
    district: 'Westminster',
    region: 'Greater London',
  };
  const mockApiResponse = {
    data: {
      assessment: {
        postcode: 'SW1A1AA',
        overallRating: 'Medium',
        summary: 'Low to medium risk area.',
        riskBreakdown: {
          flood: 'No designated flood zone was identified.',
          subsidence: 'BGS geology data was unavailable.',
        },
      },
      floodData: {
        available: true,
        source: 'Environment Agency',
        zone: null,
        severity: null,
        warnings: [],
        error: null,
      },
    },
    error: null,
  };

  const createMockResponse = (body: object, ok: boolean, status: number) => ({
    ok,
    status,
    text: async () => JSON.stringify(body),
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a RiskAssessmentResult on a successful response', async () => {
    const mockResponse = createMockResponse(mockApiResponse, true, 200);

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const { result } = renderHook(() => useRiskAssessment());

    let assessment: RiskAssessmentResult | null = null;
    await act(async () => {
      assessment = await result.current.assess(mockLocation);
    });

    expect(assessment).toEqual({
      assessment: {
        postcode: 'SW1A1AA',
        overallRating: 'Medium',
        summary: 'Low to medium risk area.',
        riskBreakdown: {
          flood: 'No designated flood zone was identified.',
          subsidence: 'BGS geology data was unavailable.',
        },
      },
      floodData: {
        available: true,
        source: 'Environment Agency',
        zone: null,
        severity: null,
        warnings: [],
        error: null,
      },
    });
  });

  it('returns the assessment failure error message on a non-200 response', async () => {
    const mockResponse = createMockResponse({
      data: null,
      error: 'Failed to generate assessment',
    }, false, 500);

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const { result } = renderHook(() => useRiskAssessment());

    await act(async () => {
      await expect(result.current.assess(mockLocation)).rejects.toThrow(
        'Unable to generate a risk assessment. Please try again.'
      );
    });

    expect(result.current.error).toBe(
      'Unable to generate a risk assessment. Please try again.'
    );
  });

  it('returns the network error message when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useRiskAssessment());

    await act(async () => {
      await expect(result.current.assess(mockLocation)).rejects.toThrow(
        'Unable to connect. Please check your connection and try again.'
      );
    });

    expect(result.current.error).toBe(
      'Unable to connect. Please check your connection and try again.'
    );
  });

  it('sets isLoading to true during the request', async () => {
    const mockResponse = createMockResponse(mockApiResponse, true, 200);
    let resolveFetchResponse: (response: Response) => void = () => undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetchResponse = resolve;
    });

    vi.mocked(fetch).mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useRiskAssessment());
    let assessmentPromise: Promise<RiskAssessmentResult> | null = null;

    act(() => {
      assessmentPromise = result.current.assess(mockLocation);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFetchResponse(mockResponse as Response);
      await assessmentPromise;
    });
  });

  it('sets isLoading to false after the request completes', async () => {
    const mockResponse = createMockResponse(mockApiResponse, true, 200);

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const { result } = renderHook(() => useRiskAssessment());

    await act(async () => {
      await result.current.assess(mockLocation);
    });

    expect(result.current.isLoading).toBe(false);
  });
});
