import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeocoding } from './useGeocoding';
import type { PostcodeLocation } from '../types';

describe('useGeocoding', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a GeocodeResult with correct coordinates on a valid postcode', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        result: {
          postcode: 'SW1A 1AA',
          latitude: 51.5034,
          longitude: -0.1276,
          admin_ward: 'St James',
          admin_district: 'Westminster',
          region: 'Greater London',
        },
      }),
    };

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const { result } = renderHook(() => useGeocoding());

    let geocodeResult: PostcodeLocation | null = null;
    await act(async () => {
      geocodeResult = await result.current.geocode('SW1A1AA');
    });

    expect(geocodeResult).toEqual({
      postcode: 'SW1A 1AA',
      latitude: 51.5034,
      longitude: -0.1276,
      area: 'St James',
      district: 'Westminster',
      region: 'Greater London',
    });
  });

  it('returns the not found error message when Postcodes.io returns 404', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: async () => ({ result: null }),
    };

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      await expect(result.current.geocode('INVALID')).rejects.toThrow(
        'That postcode was not found. Please check and try again.'
      );
    });

    expect(result.current.error).toBe(
      'That postcode was not found. Please check and try again.'
    );
  });

  it('returns the network error message when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      await expect(result.current.geocode('SW1A1AA')).rejects.toThrow(
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
        result: {
          postcode: 'SW1A 1AA',
          latitude: 51.5034,
          longitude: -0.1276,
        },
      }),
    };
    let resolveFetchResponse: (response: Response) => void = () => undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetchResponse = resolve;
    });

    vi.mocked(fetch).mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useGeocoding());
    let geocodePromise: Promise<PostcodeLocation | null> | null = null;

    act(() => {
      geocodePromise = result.current.geocode('SW1A1AA');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFetchResponse(mockResponse as Response);
      await geocodePromise;
    });
  });

  it('sets isLoading to false after the request completes', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        result: {
          postcode: 'SW1A 1AA',
          latitude: 51.5034,
          longitude: -0.1276,
        },
      }),
    };

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      await result.current.geocode('SW1A1AA');
    });

    expect(result.current.isLoading).toBe(false);
  });
});
