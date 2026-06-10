import { useState, useCallback } from 'react';
import type { PostcodeLocation, RiskAssessment, GeocodeError, RiskAssessmentError } from '../types';
import { geocodePostcode, assessPropertyRisk } from '../utils/api';

export function useGeocoding() {
  const [location, setLocation] = useState<PostcodeLocation | null>(null);
  const [error, setError] = useState<GeocodeError | null>(null);
  const [loading, setLoading] = useState(false);

  const geocode = useCallback(async (postcode: string) => {
    setLoading(true);
    setError(null);
    setLocation(null);

    try {
      const result = await geocodePostcode(postcode);
      setLocation(result);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Unknown error',
        postcode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, error, loading, geocode };
}

export function useRiskAssessment() {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<RiskAssessmentError | null>(null);
  const [loading, setLoading] = useState(false);

  const assess = useCallback(async (postcode: string, location: PostcodeLocation) => {
    setLoading(true);
    setError(null);
    setAssessment(null);

    try {
      const result = await assessPropertyRisk(postcode, location);
      setAssessment(result);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Unknown error',
        postcode,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { assessment, error, loading, assess };
}
