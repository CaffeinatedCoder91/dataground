import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRiskAssessment } from './useRiskAssessment';
import type { PostcodeLocation, RiskAssessment } from '../types';

describe('useRiskAssessment', () => {
  const mockLocation: PostcodeLocation = {
    postcode: 'SW1A1AA',
    latitude: 51.5034,
    longitude: -0.1276,
    area: 'St James',
    district: 'Westminster',
    region: 'Greater London',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a RiskAssessment on a successful response', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          postcode: 'SW1A1AA',
          floodRisk: { level: 'low', score: 2 },
          fireRisk: { level: 'low', score: 2 },
          subsidenceRisk: { level: 'high', score: 8 },
          overallScore: 4,
          summary: 'Low to medium risk area.',
          keyFactors: ['Factor 1', 'Factor 2', 'Factor 3'],
        },
        error: null,
      }),
    };

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const { result } = renderHook(() => useRiskAssessment());

    let assessment: RiskAssessment | null = null;
    await act(async () => {
      assessment = await result.current.assess(mockLocation);
    });

    expect(assessment).toEqual({
      postcode: 'SW1A1AA',
      floodRisk: { level: 'low', score: 2 },
      fireRisk: { level: 'low', score: 2 },
      subsidenceRisk: { level: 'high', score: 8 },
      overallScore: 4,
      summary: 'Low to medium risk area.',
      keyFactors: ['Factor 1', 'Factor 2', 'Factor 3'],
    });
  });

  it('returns the assessment failure error message on a non-200 response', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: async () => ({
        data: null,
        error: 'Failed to generate assessment',
      }),
    };

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
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          postcode: 'SW1A1AA',
          floodRisk: { level: 'low', score: 2 },
          fireRisk: { level: 'low', score: 2 },
          subsidenceRisk: { level: 'high', score: 8 },
          overallScore: 4,
          summary: 'Low to medium risk area.',
          keyFactors: ['Factor 1', 'Factor 2', 'Factor 3'],
        },
        error: null,
      }),
    };
    let resolveFetchResponse: (response: Response) => void = () => undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetchResponse = resolve;
    });

    vi.mocked(fetch).mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useRiskAssessment());
    let assessmentPromise: Promise<RiskAssessment> | null = null;

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
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          postcode: 'SW1A1AA',
          floodRisk: { level: 'low', score: 2 },
          fireRisk: { level: 'low', score: 2 },
          subsidenceRisk: { level: 'high', score: 8 },
          overallScore: 4,
          summary: 'Low to medium risk area.',
          keyFactors: ['Factor 1', 'Factor 2', 'Factor 3'],
        },
        error: null,
      }),
    };

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const { result } = renderHook(() => useRiskAssessment());

    await act(async () => {
      await result.current.assess(mockLocation);
    });

    expect(result.current.isLoading).toBe(false);
  });
});
