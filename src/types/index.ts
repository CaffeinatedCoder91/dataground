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

export interface RiskBreakdown {
  flood: string;
  subsidence: string;
}

export type OverallRating = 'Incomplete' | 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskAssessment {
  postcode: string;
  overallRating: OverallRating;
  summary: string;
  riskBreakdown: RiskBreakdown;
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
  available: boolean;
  source: 'Environment Agency';
  zone: string | null;
  severity: number | null;
  warnings: FloodWarning[];
  error: string | null;
  polygon?: Feature<Polygon | MultiPolygon, Record<string, never>>;
}

export type SubsidenceRisk = 'High' | 'Medium' | 'Low' | 'Unknown';

export interface GeologyData {
  available: boolean;
  source: 'British Geological Survey';
  formation: string | null;
  subsidenceRisk: SubsidenceRisk;
  disclaimer: string;
  error: string | null;
}

export interface RiskPayload {
  postcode: string;
  latitude: number;
  longitude: number;
  flood: FloodRiskData;
  geology: GeologyData;
}

export interface RiskAssessmentResult {
  assessment: RiskAssessment;
  floodData: FloodRiskData;
  geologyData?: GeologyData;
}
