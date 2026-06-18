import { z } from 'zod';
import type { FloodRiskData, FloodWarning } from '../types';

const EA_FLOOD_AREAS_URL = 'https://environment.data.gov.uk/flood-monitoring/id/floodAreas';
const EA_FLOOD_WARNINGS_URL = 'https://environment.data.gov.uk/flood-monitoring/api/floodAreas';
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
  zone: null,
  severity: null,
  warnings: [],
  error,
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
  geometry: floodGeometrySchema.nullable(),
});

const floodAreaResponseSchema = z.object({
  items: z.array(z.object({
    notation: z.string().optional(),
    label: z.string().optional(),
    eaAreaCode: z.string().optional(),
    polygon: floodPolygonSchema.nullish(),
  })).optional(),
});

const floodWarningResponseSchema = z.object({
  items: z.array(z.object({
    description: z.string().optional(),
    severityLevel: z.number().optional(),
    areaName: z.string().optional(),
  })).optional(),
});

type FloodAreaResponse = z.infer<typeof floodAreaResponseSchema>;
type FloodWarningResponse = z.infer<typeof floodWarningResponseSchema>;

export const fetchFloodRisk = async (
  latitude: number,
  longitude: number
): Promise<FloodRiskData> => {
  const responseResult = await fetchWithTimeout(
    `${EA_FLOOD_AREAS_URL}?lat=${latitude}&long=${longitude}&_limit=5`
  ).then<OperationResult<Response>, OperationResult<Response>>(
    (response) => ({ data: response, error: null }),
    () => ({ data: null, error: 'Environment Agency flood data is unavailable right now.' })
  );

  if (!responseResult.data) {
    return emptyFloodRiskData(responseResult.error);
  }

  const response: Response = responseResult.data;

  if (!response.ok) {
    return emptyFloodRiskData('Environment Agency flood data is unavailable right now.');
  }

  const areaDataResult = await response.json().then<OperationResult<FloodAreaResponse>, OperationResult<FloodAreaResponse>>(
    (data) => {
      const validationResult = floodAreaResponseSchema.safeParse(data);
      if (!validationResult.success) {
        return { data: null, error: 'Environment Agency flood data could not be read.' };
      }

      return { data: validationResult.data, error: null };
    },
    () => ({ data: null, error: 'Environment Agency flood data could not be read.' })
  );

  if (!areaDataResult.data) {
    return emptyFloodRiskData(areaDataResult.error);
  }

  const items = areaDataResult.data.items || [];

  if (items.length === 0) {
    return emptyFloodRiskData();
  }

  const primaryArea = items[0];
  const notation = primaryArea.notation || '';
  const zone = primaryArea.label || null;

  let warnings: FloodWarning[] = [];
  let severity: number | null = null;
  let floodError: string | null = null;

  if (notation) {
    const warningResponseResult = await fetchWithTimeout(
      `${EA_FLOOD_WARNINGS_URL}/${notation}`
    ).then<OperationResult<Response>, OperationResult<Response>>(
      (warningResponse) => ({ data: warningResponse, error: null }),
      () => ({ data: null, error: 'Environment Agency flood warnings are unavailable right now.' })
    );

    if (!warningResponseResult.data) {
      floodError = warningResponseResult.error;
    } else if (!warningResponseResult.data.ok) {
      floodError = 'Environment Agency flood warnings are unavailable right now.';
    } else {
      const warningDataResult = await warningResponseResult.data.json().then<OperationResult<FloodWarningResponse>, OperationResult<FloodWarningResponse>>(
        (warningData) => {
          const validationResult = floodWarningResponseSchema.safeParse(warningData);
          if (!validationResult.success) {
            return { data: null, error: 'Environment Agency flood warnings could not be read.' };
          }

          return { data: validationResult.data, error: null };
        },
        () => ({ data: null, error: 'Environment Agency flood warnings could not be read.' })
      );

      if (!warningDataResult.data) {
        floodError = warningDataResult.error;
      } else {
        const warningItems = warningDataResult.data.items || [];

        warnings = warningItems
          .filter((item) => item.description)
          .map((item) => ({
            description: item.description || '',
            severity: item.severityLevel || 0,
            areaName: item.areaName || zone || 'Flood Area',
          }));

        if (warningItems.length > 0 && warningItems[0].severityLevel) {
          severity = warningItems[0].severityLevel;
        }
      }
    }
  }

  const result: FloodRiskData = {
    zone,
    severity: severity || (zone ? 1 : null),
    warnings,
    error: floodError,
  };

  if (primaryArea.polygon?.geometry) {
    result.polygon = {
      type: 'Feature',
      geometry: primaryArea.polygon.geometry,
      properties: {},
    };
  }

  return result;
};
