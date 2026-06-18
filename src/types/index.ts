import type { Feature, MultiPolygon, Polygon } from 'geojson';

export const RISK_LEVEL: {
  LOW: 'low';
  MEDIUM: 'medium';
  HIGH: 'high';
} = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

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

export interface FloodWarning {
  description: string;
  severity: number;
  areaName: string;
}

export interface FloodRiskData {
  zone: string | null;
  severity: number | null;
  warnings: FloodWarning[];
  error: string | null;
  polygon?: Feature<Polygon | MultiPolygon, Record<string, never>>;
}

export interface RiskAssessmentResult {
  assessment: RiskAssessment;
  floodData: FloodRiskData;
}
