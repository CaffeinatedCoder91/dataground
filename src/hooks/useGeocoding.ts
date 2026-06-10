import { useState } from 'react';
import type { PostcodeLocation } from '../types';

interface UseGeocodingReturn {
  geocode: (postcode: string) => Promise<PostcodeLocation>;
  isLoading: boolean;
  error: string | null;
}

interface PostcodesApiResult {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_ward?: string | null;
  admin_district?: string | null;
  region?: string | null;
}

interface PostcodesApiResponse {
  result: PostcodesApiResult | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parsePostcodesApiResponse = (value: unknown): PostcodesApiResponse => {
  if (!isRecord(value) || !isRecord(value.result)) {
    throw new Error('INVALID_RESPONSE');
  }

  const result = value.result;

  if (
    typeof result.postcode !== 'string' ||
    typeof result.latitude !== 'number' ||
    typeof result.longitude !== 'number'
  ) {
    throw new Error('INVALID_RESPONSE');
  }

  return {
    result: {
      postcode: result.postcode,
      latitude: result.latitude,
      longitude: result.longitude,
      admin_ward: typeof result.admin_ward === 'string' ? result.admin_ward : null,
      admin_district: typeof result.admin_district === 'string' ? result.admin_district : null,
      region: typeof result.region === 'string' ? result.region : null,
    },
  };
};

export const useGeocoding = (): UseGeocodingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = async (postcode: string): Promise<PostcodeLocation> => {
    setIsLoading(true);
    setError(null);

    try {
      const strippedPostcode = postcode.replace(/\s/g, '');
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${strippedPostcode}`
      );

      if (response.status === 404) {
        throw new Error('NOT_FOUND');
      }

      if (!response.ok) {
        throw new Error('NETWORK_ERROR');
      }

      const data = parsePostcodesApiResponse(await response.json());

      if (!data.result) {
        throw new Error('INVALID_RESPONSE');
      }

      const result = data.result;

      return {
        postcode: result.postcode || postcode,
        latitude: result.latitude,
        longitude: result.longitude,
        area: result.admin_ward || '',
        district: result.admin_district || '',
        region: result.region || '',
      };
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error && caughtError.message === 'NOT_FOUND'
          ? 'That postcode was not found. Please check and try again.'
          : 'Unable to connect. Please check your connection and try again.';

      setError(errorMessage);
      throw new Error(errorMessage, { cause: caughtError });
    } finally {
      setIsLoading(false);
    }
  };

  return { geocode, isLoading, error };
};
