import type { StructuredRiskContext } from '../../src/services/reportBuilder.js';

export function buildRealDataRiskPrompt(context: StructuredRiskContext): string {
  return `You are an insurance risk analyst. The following is real data from official UK sources.

POSTCODE: ${context.postcode}
COORDINATES: ${context.latitude.toFixed(4)}, ${context.longitude.toFixed(4)}

=== REAL DATA FROM OFFICIAL UK SOURCES ===

FLOOD RISK (Environment Agency):
- Zone: ${context.flood.zone || 'Not in designated flood zone'}
- Severity Level: ${context.flood.severity !== null ? context.flood.severity : 'N/A'}
- Active Warning: ${context.flood.activeWarning ? 'Yes' : 'No'}
- Description: ${context.flood.description}

GEOLOGY & SUBSIDENCE RISK (BGS - British Geological Survey):
- Geological Formation: ${context.geology.formation || 'Unknown'}
- Subsidence Risk: ${context.geology.subsidenceRisk}
- Source: BGS 1:625k superficial geology mapping

=== YOUR TASK ===

Synthesise these real data points into an insurance-relevant risk assessment.

You MUST respond with ONLY a JSON object. No markdown. No code blocks. No triple backticks. No explanatory text before or after. Just the raw JSON object.

{
  "overallRating": "Low" | "Medium" | "High" | "Critical",
  "summary": "2-3 sentence plain English summary of the overall risk profile",
  "riskBreakdown": {
    "flood": "1-2 sentences on flood risk based on the EA data provided. Only reference zone, severity, or warnings if they exist in the data.",
    "subsidence": "1-2 sentences on subsidence risk based on the BGS geology data provided. Only reference the formation if it exists."
  }
}

Critical instructions:
- Base your assessment ONLY on the real data provided above
- Do NOT invent any data, statistics, or risk factors not present in the data
- If a data field is empty or 'Unknown', acknowledge that absence in your analysis
- Ensure the summary and breakdown reference the actual data points provided
- Do not wrap the JSON in code blocks or markdown
- Do not include any text before or after the JSON object`;
}
