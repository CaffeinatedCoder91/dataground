import { z } from 'zod';

export const maxDuration = 30;

export const config = {
  runtime: 'nodejs',
};

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

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
    const wfsUrl = `https://map.bgs.ac.uk/arcgis/services/BGS_Detailed_Geology/MapServer/WFSServer?service=WFS&version=2.0.0&request=GetFeature&typeName=BGS_Detailed_Geology:GBR_BGS_625k_SLS&bbox=${bbox}&outputFormat=application/json`;
    console.log('Fetching BGS WFS:', wfsUrl);

    const FETCH_TIMEOUT_MS = 8000;
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

    const responseResult = await fetchWithTimeout(wfsUrl).then<OperationResult<Response>, OperationResult<Response>>(
      (response) => ({ data: response, error: null }),
      () => ({ data: null, error: 'BGS WFS service unavailable' })
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
        { data: null, error: 'BGS WFS service unavailable' },
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
