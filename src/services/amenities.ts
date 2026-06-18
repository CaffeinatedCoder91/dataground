import { z } from 'zod';
import type { AmenitiesData, Amenity } from '../types';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const FETCH_TIMEOUT_MS = 10000;
const SEARCH_RADIUS_M = 500;

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

const emptyAmenitiesData = (error: string | null = null): AmenitiesData => ({
  amenities: [],
  error,
});

const overpassNodeSchema = z.object({
  id: z.number().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  tags: z.object({
    name: z.string().optional(),
  }).optional(),
});

const overpassWaySchema = z.object({
  id: z.number().optional(),
  center: z.object({
    lat: z.number().optional(),
    lon: z.number().optional(),
  }).optional(),
  tags: z.object({
    name: z.string().optional(),
  }).optional(),
});

const overpassResponseSchema = z.object({
  elements: z.array(z.union([overpassNodeSchema, overpassWaySchema])).optional(),
});

type OverpassResponse = z.infer<typeof overpassResponseSchema>;

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const fetchWithTimeout = async (url: string, body: string): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response: Response = await fetch(url, {
      method: 'POST',
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildOverpassQuery = (latitude: number, longitude: number): string => {
  const bbox = `${latitude - SEARCH_RADIUS_M / 111000},${longitude - SEARCH_RADIUS_M / 111000 / Math.cos((latitude * Math.PI) / 180)},${latitude + SEARCH_RADIUS_M / 111000},${longitude + SEARCH_RADIUS_M / 111000 / Math.cos((latitude * Math.PI) / 180)}`;

  return `[bbox:${bbox}];(node["amenity"="fire_station"];node["amenity"="hospital"];node["amenity"="clinic"];node["amenity"="doctors"];node["emergency"="fire_station"];way["amenity"="fire_station"];way["amenity"="hospital"];way["amenity"="clinic"];);out center;`;
};

export const fetchAmenitiesData = async (
  latitude: number,
  longitude: number
): Promise<AmenitiesData> => {
  const query = buildOverpassQuery(latitude, longitude);

  const responseResult = await fetchWithTimeout(OVERPASS_API_URL, query).then<
    OperationResult<Response>,
    OperationResult<Response>
  >(
    (response) => ({ data: response, error: null }),
    () => ({ data: null, error: 'Amenity data unavailable' })
  );

  if (!responseResult.data) {
    return emptyAmenitiesData(responseResult.error);
  }

  const response: Response = responseResult.data;

  if (!response.ok) {
    return emptyAmenitiesData('Amenity data unavailable');
  }

  const dataResult = await response.json().then<OperationResult<OverpassResponse>, OperationResult<OverpassResponse>>(
    (data) => {
      const validationResult = overpassResponseSchema.safeParse(data);
      if (!validationResult.success) {
        return { data: null, error: 'Amenity data could not be read.' };
      }

      return { data: validationResult.data, error: null };
    },
    () => ({ data: null, error: 'Amenity data could not be read.' })
  );

  if (!dataResult.data) {
    return emptyAmenitiesData(dataResult.error);
  }

  const elements = dataResult.data.elements || [];
  const amenities: Amenity[] = [];

  for (const element of elements) {
    const elementLat = 'lat' in element && element.lat ? element.lat : ('center' in element && element.center ? element.center.lat : undefined);
    const elementLon = 'lon' in element && element.lon ? element.lon : ('center' in element && element.center ? element.center.lon : undefined);
    const name = element.tags?.name;

    if (elementLat && elementLon && name) {
      const distance = calculateDistance(latitude, longitude, elementLat, elementLon);

      if (distance <= SEARCH_RADIUS_M) {
        const typeMatch = Object.entries(element.tags || {})
          .find(([key]) => ['amenity', 'emergency'].includes(key));
        const type = typeMatch ? typeMatch[1] : 'amenity';

        amenities.push({
          name,
          distance,
          type: String(type),
        });
      }
    }
  }

  amenities.sort((a, b) => a.distance - b.distance);

  return {
    amenities: amenities.slice(0, 10),
    error: null,
  };
};
