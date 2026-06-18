import { z } from 'zod';
import type { GeologyData, SubsidenceRisk } from '../types';

const FETCH_TIMEOUT_MS = 8000;

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

const emptyGeologyData = (error: string | null = null): GeologyData => ({
  formation: null,
  subsidenceRisk: 'Unknown',
  disclaimer: 'Based on BGS 1:625k superficial geology — indicative only',
  error,
});

const bgsFeatureSchema = z.object({
  properties: z.object({
    LEX_D: z.string().optional(),
    RCS_D: z.string().optional(),
  }).optional(),
});

const bgsFeatureCollectionSchema = z.object({
  features: z.array(bgsFeatureSchema).optional(),
});

type BGSFeatureCollection = z.infer<typeof bgsFeatureCollectionSchema>;

const lexToSubsidenceRisk = (lexD: string | undefined): SubsidenceRisk => {
  if (!lexD) return 'Unknown';

  const upperLex = lexD.toUpperCase();

  if (upperLex.includes('CLAY')) return 'High';
  if (upperLex.includes('ALLUVIUM')) return 'Medium';
  if (upperLex.includes('CHALK')) return 'Low';
  if (upperLex.includes('LIMESTONE')) return 'Low';
  if (upperLex.includes('SANDSTONE')) return 'Low';

  return 'Unknown';
};

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response: Response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchGeologyData = async (
  latitude: number,
  longitude: number
): Promise<GeologyData> => {
  const responseResult = await fetchWithTimeout(
    `/api/geology?lat=${latitude}&lng=${longitude}`
  ).then<OperationResult<Response>, OperationResult<Response>>(
    (response) => ({ data: response, error: null }),
    () => ({ data: null, error: 'Geology data is unavailable right now.' })
  );

  if (!responseResult.data) {
    return emptyGeologyData(responseResult.error);
  }

  const response: Response = responseResult.data;

  if (!response.ok) {
    return emptyGeologyData('Geology data is unavailable right now.');
  }

  const dataResult = await response.json().then<OperationResult<BGSFeatureCollection>, OperationResult<BGSFeatureCollection>>(
    (data) => {
      const validationResult = bgsFeatureCollectionSchema.safeParse(data);
      if (!validationResult.success) {
        return { data: null, error: 'Geology data could not be read.' };
      }

      return { data: validationResult.data, error: null };
    },
    () => ({ data: null, error: 'Geology data could not be read.' })
  );

  if (!dataResult.data) {
    return emptyGeologyData(dataResult.error);
  }

  const features = dataResult.data.features || [];

  if (features.length === 0) {
    return emptyGeologyData('No geology data in this area');
  }

  const primaryFeature = features[0];
  const properties = primaryFeature.properties || {};
  const lexD = properties.LEX_D;
  const rcsD = properties.RCS_D;

  return {
    formation: rcsD || lexD || null,
    subsidenceRisk: lexToSubsidenceRisk(lexD),
    disclaimer: 'Based on BGS 1:625k superficial geology — indicative only',
    error: null,
  };
};
