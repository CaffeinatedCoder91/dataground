import { useRef } from 'react';
import type { PostcodeLocation, RiskAssessment, FloodRiskData, GeologyData } from '../types';

interface CachedResult {
  location: PostcodeLocation;
  assessment: RiskAssessment;
  floodData?: FloodRiskData;
  geologyData?: GeologyData;
}

interface UseResultsCacheReturn {
  getCachedResult: (postcode: string) => CachedResult | null;
  setCachedResult: (postcode: string, result: CachedResult) => void;
}

export const useResultsCache = (): UseResultsCacheReturn => {
  const cacheRef = useRef<Map<string, CachedResult>>(new Map());

  const normalisePostcode = (postcode: string): string => {
    return postcode.replace(/\s/g, '').toUpperCase();
  };

  const getCachedResult = (postcode: string): CachedResult | null => {
    const normalised = normalisePostcode(postcode);
    return cacheRef.current.get(normalised) || null;
  };

  const setCachedResult = (postcode: string, result: CachedResult): void => {
    const normalised = normalisePostcode(postcode);
    cacheRef.current.set(normalised, result);
  };

  return { getCachedResult, setCachedResult };
};
