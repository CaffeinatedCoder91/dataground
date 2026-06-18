import type { RiskPayload } from '../types';

export interface StructuredRiskContext {
  postcode: string;
  latitude: number;
  longitude: number;
  flood: {
    zone: string | null;
    severity: number | null;
    activeWarning: boolean;
    description: string;
  };
  geology: {
    formation: string | null;
    lexDescription: string;
    subsidenceRisk: string;
  };
}

export const buildRiskContext = (
  payload: RiskPayload
): StructuredRiskContext => {
  const { postcode, latitude, longitude } = payload;
  const floodData = payload.flood;
  const geologyData = payload.geology;
  const activeWarning = (floodData.warnings || []).length > 0;
  const floodDescription = !floodData.available
    ? 'Environment Agency flood data unavailable'
    : floodData.zone
    ? `Zone ${floodData.zone} (severity level ${floodData.severity || 0})`
    : 'No flood zone identified';

  return {
    postcode,
    latitude,
    longitude,
    flood: {
      zone: floodData.zone,
      severity: floodData.severity,
      activeWarning,
      description: floodDescription,
    },
    geology: {
      formation: geologyData.formation,
      lexDescription: geologyData.available ? geologyData.formation || 'Unknown' : 'British Geological Survey data unavailable',
      subsidenceRisk: geologyData.available ? geologyData.subsidenceRisk : 'Unknown',
    },
  };
};
