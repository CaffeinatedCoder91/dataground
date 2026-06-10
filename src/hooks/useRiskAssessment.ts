import { useState } from 'react';
import type { PostcodeLocation, RiskAssessment, RiskLevel } from '../types';
import { RISK_LEVEL } from '../types';

interface UseRiskAssessmentReturn {
  assess: (location: PostcodeLocation) => Promise<RiskAssessment>;
  isLoading: boolean;
  error: string | null;
}

interface RiskAssessmentApiResponse {
  data: RiskAssessment | null;
  error: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isRiskLevel = (value: unknown): value is RiskLevel =>
  value === RISK_LEVEL.LOW || value === RISK_LEVEL.MEDIUM || value === RISK_LEVEL.HIGH;

const isRiskScore = (value: unknown): value is RiskAssessment['floodRisk'] => {
  if (!isRecord(value)) {
    return false;
  }

  return isRiskLevel(value.level) && typeof value.score === 'number';
};

const parseRiskAssessment = (value: unknown): RiskAssessment => {
  if (!isRecord(value)) {
    throw new Error('INVALID_RESPONSE');
  }

  const keyFactors = value.keyFactors;

  if (
    !isRiskScore(value.floodRisk) ||
    !isRiskScore(value.fireRisk) ||
    !isRiskScore(value.subsidenceRisk) ||
    typeof value.overallScore !== 'number' ||
    typeof value.summary !== 'string' ||
    !Array.isArray(keyFactors) ||
    !keyFactors.every((factor) => typeof factor === 'string')
  ) {
    throw new Error('INVALID_RESPONSE');
  }

  return {
    postcode: typeof value.postcode === 'string' ? value.postcode : '',
    floodRisk: value.floodRisk,
    fireRisk: value.fireRisk,
    subsidenceRisk: value.subsidenceRisk,
    overallScore: value.overallScore,
    keyFactors,
    summary: value.summary,
  };
};

const parseRiskAssessmentApiResponse = (value: unknown): RiskAssessmentApiResponse => {
  if (!isRecord(value)) {
    throw new Error('INVALID_RESPONSE');
  }

  if (value.error !== null && typeof value.error !== 'string') {
    throw new Error('INVALID_RESPONSE');
  }

  return {
    data: value.data === null ? null : parseRiskAssessment(value.data),
    error: value.error,
  };
};

export const useRiskAssessment = (): UseRiskAssessmentReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assess = async (location: PostcodeLocation): Promise<RiskAssessment> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postcode: location.postcode,
          latitude: location.latitude,
          longitude: location.longitude,
          region: location.region,
        }),
      });

      const data = parseRiskAssessmentApiResponse(await response.json());

      if (!response.ok || data.error) {
        throw new Error('ASSESSMENT_FAILED');
      }

      if (!data.data) {
        throw new Error('ASSESSMENT_FAILED');
      }

      return data.data;
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error &&
        caughtError.message === 'ASSESSMENT_FAILED'
          ? 'Unable to generate a risk assessment. Please try again.'
          : 'Unable to connect. Please check your connection and try again.';

      setError(errorMessage);
      throw new Error(errorMessage, { cause: caughtError });
    } finally {
      setIsLoading(false);
    }
  };

  return { assess, isLoading, error };
};
