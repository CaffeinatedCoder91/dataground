import { z } from 'zod';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const maxDuration = 30;

export const config = {
  runtime: 'nodejs',
};

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const BGS_WMS_URL = 'https://map.bgs.ac.uk/arcgis/services/BGS_Detailed_Geology/MapServer/WmsServer';
const BGS_SUPERFICIAL_LAYER = 'BGS.50k.Superficial.deposits';
const execFileAsync = promisify(execFile);

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

const coordinateQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validationResult = coordinateQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      console.error('Geology validation error:', validationResult.error);
      return Response.json(
        { data: null, error: 'Invalid coordinates' },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }

    const { lat, lng } = validationResult.data;
    const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`;
    const wmsUrl = new URL(BGS_WMS_URL);
    wmsUrl.search = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetFeatureInfo',
      LAYERS: BGS_SUPERFICIAL_LAYER,
      QUERY_LAYERS: BGS_SUPERFICIAL_LAYER,
      CRS: 'CRS:84',
      BBOX: bbox,
      WIDTH: '101',
      HEIGHT: '101',
      I: '50',
      J: '50',
      INFO_FORMAT: 'application/geo+json',
    }).toString();
    console.log('Fetching BGS WMS:', wmsUrl.toString());

    const FETCH_TIMEOUT_MS = 8000;
    const fetchBgsWithCurlFallback = async (url: string): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        return await fetch(url, { signal: controller.signal });
      } catch {
        const { stdout } = await execFileAsync('curl', [
          '--fail',
          '--silent',
          '--show-error',
          '--max-time',
          String(Math.ceil(FETCH_TIMEOUT_MS / 1000)),
          url,
        ]);
        return new Response(stdout, {
          status: 200,
          headers: { 'Content-Type': 'application/geo+json' },
        });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const fetchWithTimeout = async (url: string): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response: Response = url.startsWith(BGS_WMS_URL)
          ? await fetchBgsWithCurlFallback(url)
          : await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const responseResult = await fetchWithTimeout(wmsUrl.toString()).then<OperationResult<Response>, OperationResult<Response>>(
      (response) => ({ data: response, error: null }),
      () => ({ data: null, error: 'BGS geology service unavailable' })
    );

    if (!responseResult.data) {
      console.error('Geology fetch error:', responseResult.error);
      return Response.json(
        { data: null, error: responseResult.error },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }

    const response: Response = responseResult.data;
    if (!response.ok) {
      console.error('Geology response not ok:', response.status);
      return Response.json(
        { data: null, error: 'BGS geology service unavailable' },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }

    const data = await response.json();
    console.log('Geology data fetched successfully');
    return Response.json({ data, error: null });
  } catch (error) {
    console.error('Geology handler error:', error instanceof Error ? error.message : String(error));
    return Response.json(
      { data: null, error: 'Failed to fetch geology data' },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
    );
  }
}

export { GET };
export default GET;
