export function buildRiskAssessmentPrompt(
  postcode: string,
  region: string,
  latitude: number,
  longitude: number
): string {
  return `You are a property risk assessment expert. Analyse the following UK property location and provide a risk assessment for flood, fire, and subsidence risks.

Location details:
- Postcode: ${postcode}
- Region: ${region}
- Coordinates: ${latitude}, ${longitude}

Based on geographic and climatic knowledge of this area, provide a JSON response with the following exact structure (no other text):
{
  "floodRisk": {
    "level": "low" | "medium" | "high",
    "score": number between 1-10
  },
  "fireRisk": {
    "level": "low" | "medium" | "high",
    "score": number between 1-10
  },
  "subsidenceRisk": {
    "level": "low" | "medium" | "high",
    "score": number between 1-10
  },
  "overallScore": number between 1-10,
  "summary": "2-3 sentence summary of the overall risk profile",
  "keyFactors": ["factor 1", "factor 2", "factor 3"]
}

Respond with valid JSON only. No markdown, no code blocks, just the JSON object.`;
}
