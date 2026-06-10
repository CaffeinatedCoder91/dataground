export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type RiskLevel = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL];

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PostcodeLocation {
  postcode: string;
  latitude: number;
  longitude: number;
  area: string;
  district: string;
  region: string;
}

export interface RiskScore {
  level: RiskLevel;
  score: number;
}

export interface RiskAssessment {
  postcode: string;
  floodRisk: RiskScore;
  fireRisk: RiskScore;
  subsidenceRisk: RiskScore;
  overallScore: number;
  keyFactors: string[];
  summary: string;
}

export interface GeocodeError {
  message: string;
  postcode: string;
}

export interface RiskAssessmentError {
  message: string;
  postcode: string;
}
