import { z } from 'zod';
import type { FloodRiskData } from '../types';

const EA_FLOOD_FEATURES_URL = 'https://environment.data.gov.uk/spatialdata/flood-map-for-planning-flood-zones/ogc/features/v1/collections/Flood_Zones_2_3_Rivers_and_Sea/items';
const FETCH_TIMEOUT_MS = 5000;

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

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

const emptyFloodRiskData = (error: string | null = null): FloodRiskData => ({
  available: error === null,
  source: 'Environment Agency',
  zone: null,
  severity: null,
  warnings: [],
  error,
});

const floodFeatureSchema = z.object({
  properties: z.object({
    flood_zone: z.string().optional(),
  }).optional(),
}).passthrough();

const floodFeatureCollectionSchema = z.object({
  features: z.array(floodFeatureSchema),
});

type FloodFeatureCollection = z.infer<typeof floodFeatureCollectionSchema>;

const parseFloodFeatureCollection = async (response: Response): Promise<OperationResult<FloodFeatureCollection>> => {
  const responseTextResult = await response.text().then<OperationResult<string>, OperationResult<string>>(
    (responseText) => ({ data: responseText, error: null }),
    () => ({ data: null, error: 'Environment Agency flood data could not be read.' })
  );

  if (!responseTextResult.data) {
    return { data: null, error: responseTextResult.error };
  }

  return Promise.resolve()
    .then(() => JSON.parse(responseTextResult.data || ''))
    .then<OperationResult<FloodFeatureCollection>, OperationResult<FloodFeatureCollection>>(
      (jsonData) => {
        const validationResult = floodFeatureCollectionSchema.safeParse(jsonData);
        if (!validationResult.success) {
          return { data: null, error: 'Environment Agency flood data could not be read.' };
        }

        return { data: validationResult.data, error: null };
      },
      () => ({ data: null, error: 'Environment Agency flood data could not be read.' })
    );
};

const buildFloodFeaturesUrl = (
  latitude: number,
  longitude: number
): string => {
  const bbox = `${longitude - 0.001},${latitude - 0.001},${longitude + 0.001},${latitude + 0.001}`;
  const url = new URL(EA_FLOOD_FEATURES_URL);
  url.search = new URLSearchParams({
    f: 'application/json',
    bbox,
    limit: '20',
  }).toString();
  return url.toString();
};

const fetchFloodFeatures = async (
  latitude: number,
  longitude: number
): Promise<OperationResult<FloodFeatureCollection>> => {
  const responseResult = await fetchWithTimeout(buildFloodFeaturesUrl(latitude, longitude)).then<
    OperationResult<Response>,
    OperationResult<Response>
  >(
    (response) => ({ data: response, error: null }),
    () => ({ data: null, error: 'Environment Agency flood data is unavailable right now.' })
  );

  if (!responseResult.data) {
    return { data: null, error: responseResult.error };
  }

  if (!responseResult.data.ok) {
    return { data: null, error: 'Environment Agency flood data is unavailable right now.' };
  }

  return parseFloodFeatureCollection(responseResult.data);
};

const getHighestFloodZone = (features: FloodFeatureCollection['features']): 2 | 3 | null => {
  let highestZone: 2 | 3 | null = null;

  for (const feature of features) {
    const floodZone = feature.properties?.flood_zone?.toUpperCase();
    if (floodZone === 'FZ3') {
      return 3;
    }

    if (floodZone === 'FZ2') {
      highestZone = 2;
    }
  }

  return highestZone;
};

export const fetchFloodRisk = async (
  latitude: number,
  longitude: number
): Promise<FloodRiskData> => {
  const floodFeaturesResult = await fetchFloodFeatures(latitude, longitude);
  if (!floodFeaturesResult.data) {
    return emptyFloodRiskData(floodFeaturesResult.error);
  }

  const highestFloodZone = getHighestFloodZone(floodFeaturesResult.data.features);
  if (highestFloodZone) {
    return {
      available: true,
      source: 'Environment Agency',
      zone: `Zone ${highestFloodZone}`,
      severity: highestFloodZone,
      warnings: [],
      error: null,
    };
  }

  return emptyFloodRiskData();
};
