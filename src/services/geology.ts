import { z } from 'zod';
import type { GeologyData, SubsidenceRisk } from '../types';

const FETCH_TIMEOUT_MS = 8000;

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

const emptyGeologyData = (error: string | null = null): GeologyData => ({
  available: error === null,
  source: 'British Geological Survey',
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

const geologyProxyResponseSchema = z.object({
  data: bgsFeatureCollectionSchema.nullable(),
  error: z.string().nullable(),
});

type GeologyProxyResponse = z.infer<typeof geologyProxyResponseSchema>;

const parseGeologyResponse = async (response: Response): Promise<OperationResult<GeologyProxyResponse>> => {
  const responseTextResult = await response.text().then<OperationResult<string>, OperationResult<string>>(
    (responseText) => ({ data: responseText, error: null }),
    () => ({ data: null, error: 'Geology data could not be read.' })
  );

  if (!responseTextResult.data) {
    return { data: null, error: responseTextResult.error };
  }

  const validationResult = await Promise.resolve()
    .then(() => JSON.parse(responseTextResult.data || ''))
    .then<OperationResult<GeologyProxyResponse>, OperationResult<GeologyProxyResponse>>(
      (jsonData) => {
        const parsedResult = geologyProxyResponseSchema.safeParse(jsonData);
        if (!parsedResult.success) {
          return { data: null, error: 'Geology data could not be read.' };
        }

        return { data: parsedResult.data, error: null };
      },
      () => ({ data: null, error: 'Geology data could not be read.' })
    );

  return validationResult;
};

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
    if (response.status === 400) {
      return emptyGeologyData('Geology request was rejected by the British Geological Survey.');
    }

    return emptyGeologyData('Geology data is unavailable right now.');
  }

  const dataResult = await parseGeologyResponse(response);

  if (!dataResult.data?.data) {
    return emptyGeologyData(dataResult.data?.error || dataResult.error);
  }

  const features = dataResult.data.data.features || [];

  if (features.length === 0) {
    return emptyGeologyData('No geology data in this area');
  }

  const primaryFeature = features[0];
  const properties = primaryFeature.properties || {};
  const lexD = properties.LEX_D;
  const rcsD = properties.RCS_D;

  return {
    available: true,
    source: 'British Geological Survey',
    formation: rcsD || lexD || null,
    subsidenceRisk: lexToSubsidenceRisk(lexD),
    disclaimer: 'Based on BGS 1:625k superficial geology — indicative only',
    error: null,
  };
};
