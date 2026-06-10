export interface PostcodeLocation {
  postcode: string;
  latitude: number;
  longitude: number;
  area: string;
  district: string;
  region: string;
}

export interface RiskScore {
  level: 'low' | 'medium' | 'high' | 'very-high';
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
