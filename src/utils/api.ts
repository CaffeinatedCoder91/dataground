import type { PostcodeLocation, RiskAssessment } from '../types';

const POSTCODES_API = 'https://api.postcodes.io';

export async function geocodePostcode(postcode: string): Promise<PostcodeLocation> {
  const response = await fetch(`${POSTCODES_API}/postcodes/${encodeURIComponent(postcode)}`);

  if (!response.ok) {
    throw new Error(`Failed to geocode postcode: ${postcode}`);
  }

  const data = await response.json();

  if (!data.result) {
    throw new Error(`Postcode not found: ${postcode}`);
  }

  const result = data.result;
  return {
    postcode: result.postcode,
    latitude: result.latitude,
    longitude: result.longitude,
    area: result.admin_district || 'Unknown',
    district: result.admin_county || 'Unknown',
    region: result.region || 'Unknown',
  };
}

export async function assessPropertyRisk(postcode: string, location: PostcodeLocation): Promise<RiskAssessment> {
  const response = await fetch('/api/risk-assessment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      postcode,
      latitude: location.latitude,
      longitude: location.longitude,
      area: location.area,
      region: location.region,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to assess property risk for postcode: ${postcode}`);
  }

  return response.json();
}
