import { useState } from 'react';
import { z } from 'zod';
import { RISK_LEVEL, type PostcodeLocation, type RiskAssessmentResult } from '../types';

interface UseRiskAssessmentReturn {
  assess: (location: PostcodeLocation) => Promise<RiskAssessmentResult>;
  isLoading: boolean;
  error: string | null;
}

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

const riskLevelSchema = z.enum([
  RISK_LEVEL.LOW,
  RISK_LEVEL.MEDIUM,
  RISK_LEVEL.HIGH,
]);

const riskScoreSchema = z.object({
  level: riskLevelSchema,
  score: z.number(),
});

const positionSchema = z.array(z.number()).min(2);
const linearRingSchema = z.array(positionSchema);
const polygonCoordinatesSchema = z.array(linearRingSchema);
const multiPolygonCoordinatesSchema = z.array(polygonCoordinatesSchema);

const floodGeometrySchema = z.union([
  z.object({
    type: z.literal('Polygon'),
    coordinates: polygonCoordinatesSchema,
  }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: multiPolygonCoordinatesSchema,
  }),
]);

const floodPolygonSchema = z.object({
  type: z.literal('Feature'),
  geometry: floodGeometrySchema,
  properties: z.record(z.string(), z.never()),
});

const floodRiskDataSchema = z.object({
  zone: z.string().nullable(),
  severity: z.number().nullable(),
  warnings: z.array(z.object({
    description: z.string(),
    severity: z.number(),
    areaName: z.string(),
  })),
  error: z.string().nullable(),
  polygon: floodPolygonSchema.optional(),
});

const riskAssessmentResultSchema = z.object({
  assessment: z.object({
    postcode: z.string(),
    floodRisk: riskScoreSchema,
    fireRisk: riskScoreSchema,
    subsidenceRisk: riskScoreSchema,
    overallScore: z.number(),
    keyFactors: z.array(z.string()),
    summary: z.string(),
  }),
  floodData: floodRiskDataSchema,
});

const riskAssessmentApiResponseSchema = z.object({
  data: riskAssessmentResultSchema.nullable(),
  error: z.string().nullable(),
});

type RiskAssessmentApiResponse = z.infer<typeof riskAssessmentApiResponseSchema>;

const isValidCoordinate = (latitude: number, longitude: number): boolean => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

export const useRiskAssessment = (): UseRiskAssessmentReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assess = async (location: PostcodeLocation): Promise<RiskAssessmentResult> => {
    setIsLoading(true);
    setError(null);

    if (!isValidCoordinate(location.latitude, location.longitude)) {
      const errorMessage = 'Unable to use this postcode. Please try another postcode.';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }

    const responseResult = await fetch('/api/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postcode: location.postcode,
          latitude: location.latitude,
          longitude: location.longitude,
          region: location.region,
        }),
      }).then<OperationResult<Response>, OperationResult<Response>>(
        (response) => ({ data: response, error: null }),
        () => ({ data: null, error: 'Unable to connect. Please check your connection and try again.' })
      );

    if (!responseResult.data) {
      setError(responseResult.error);
      setIsLoading(false);
      throw new Error(responseResult.error || 'Unable to connect. Please check your connection and try again.');
    }

    const response: Response = responseResult.data;

    const dataResult = await response.json().then<OperationResult<RiskAssessmentApiResponse>, OperationResult<RiskAssessmentApiResponse>>(
      (data) => {
        const validationResult = riskAssessmentApiResponseSchema.safeParse(data);
        if (!validationResult.success) {
          return { data: null, error: 'Unable to generate a risk assessment. Please try again.' };
        }

        return { data: validationResult.data, error: null };
      },
      () => ({ data: null, error: 'Unable to generate a risk assessment. Please try again.' })
    );

    if (!dataResult.data) {
      setError(dataResult.error);
      setIsLoading(false);
      throw new Error(dataResult.error || 'Unable to generate a risk assessment. Please try again.');
    }

    const data = dataResult.data;

    if (!response.ok || data.error || !data.data) {
      const errorMessage = 'Unable to generate a risk assessment. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }

    setIsLoading(false);
    return data.data;
  };

  return { assess, isLoading, error };
};
