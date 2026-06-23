# Dataground

A property risk intelligence tool for the UK insurance market.

Enter a UK postcode to see its location on a map alongside a risk intelligence
report synthesised by Claude from real UK government and open data sources —
not AI-generated guesses.

---

## What It Does

- Geocodes any UK postcode using the Postcodes.io API
- Plots the location on an interactive Mapbox map
- Fetches **real flood zone data** from the Environment Agency
- Fetches **real superficial geology data** from the British Geological Survey
- Sends the real data to Claude, which synthesises it into a structured risk
  report — overall rating, plain English summary, and a breakdown by category
  with source attribution
- Claude is instructed not to invent or assume any data that wasn't provided —
  it interprets and narrates, it does not generate risk scores from nothing

---

## Why Real Data

Most AI demo apps ask an LLM to "assess the risk" from a postcode alone, which
means the model is inventing plausible-sounding numbers with no grounding.

Dataground instead aggregates real data first, then uses Claude purely as a
synthesis layer — the same role an LLM would play in an actual insurance or
location intelligence pipeline. The interesting engineering problems were in
getting the real data sources to behave:

- The Environment Agency has separate APIs for flood **warnings** (active
  alerts) and flood **zone designations** (the planning-relevant zones 1–3
  insurers actually care about) — these are easy to conflate
- The BGS WFS service expects bounding box coordinates in `lat,lng,lat,lng`
  order for WFS 2.0.0, not the `lng,lat,lng,lat` order that seems intuitive
- A Vercel serverless function with an ambiguous handler signature (mixing
  Web `Request`/`Response` with Node-style exports) silently drops config
  like `maxDuration` and breaks `AbortController`-based timeouts — this caused
  requests to hang for the full 300s platform ceiling instead of failing fast

---

## Tech Stack

- **React 18** + **TypeScript** (strict mode) + **Vite**
- **StyleX** — Meta's atomic CSS solution
- **Mapbox GL JS** — map rendering, flood zone overlay
- **Postcodes.io** — free UK geocoding, no API key required
- **Environment Agency Flood Map for Planning** — real flood zone data (free, no key)
- **British Geological Survey WFS** — real superficial geology data (free, no key)
- **Anthropic Claude** — synthesises real data into a risk report, via a Vercel
  serverless function using a direct fetch to the Messages API
- **Vercel** — hosting and serverless functions

---

## Running Locally

**Prerequisites:** Node.js 18+, a Mapbox account, an Anthropic API key

**1. Clone the repo**

```bash
git clone https://github.com/YOUR_USERNAME/dataground.git
cd dataground
```

**2. Install dependencies**

```bash
npm install
```

**3. Create `.env.local`**

```
VITE_MAPBOX_TOKEN=your_mapbox_public_token
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your Mapbox token at [mapbox.com](https://mapbox.com) — the default public token works fine.

Get your Anthropic key at [console.anthropic.com](https://console.anthropic.com).

The Environment Agency and BGS APIs require no key.

**4. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run preview      # preview production build locally
npm run type-check   # TypeScript check
npm run test         # run tests
npm run test:watch   # run tests in watch mode
```

---

## Project Structure

```
dataground/
  api/
    config.ts              # Claude model constants
    geology.ts             # Serverless CORS proxy for BGS WFS requests
    prompts/
      realDataRiskPrompt.ts  # Prompt template for real-data synthesis
      riskAssessmentPrompt.ts
      index.ts
    risk-assessment.ts     # Vercel serverless function — aggregates data,
                            # sends real data to Claude for synthesis
    risk-assessment.test.ts
    tsconfig.json
  src/
    components/             # UI components (each with .stylex.ts and .test.tsx)
    constants/              # Shared app-wide constants
    services/
      floodRisk.ts          # Environment Agency flood zone integration
      geology.ts            # BGS superficial geology integration
      reportBuilder.ts      # assembles real data payload sent to Claude
    hooks/                  # useGeocoding, useRiskAssessment, useDebounce,
                            # useRecentSearches, useResultsCache
    styles/                 # StyleX design tokens
    types/                  # TypeScript types
    utils/                  # Helper functions
    App.tsx
```

---

## Data Sources

| Source                    | What it provides                          | Auth    | Called from       |
| ------------------------- | ----------------------------------------- | ------- | ----------------- |
| Postcodes.io              | Geocoding, lat/lng                        | None    | Browser           |
| Environment Agency        | Flood zone designation (1–3)              | None    | Browser           |
| British Geological Survey | Superficial geology, subsidence indicator | None    | Serverless (CORS) |
| Anthropic Claude          | Synthesises the above into a report       | API key | Serverless        |

If any real data source is unavailable, the report still generates from
whatever data is available — a missing source is shown as such, not silently
papered over or invented.

---

## Deployment

Deployed to Vercel. Add the following environment variables in your Vercel
project settings:

```
VITE_MAPBOX_TOKEN=your_mapbox_public_token
ANTHROPIC_API_KEY=your_anthropic_api_key
```

`maxDuration` for `api/risk-assessment.ts` is set explicitly in `vercel.json`
— this matters because an ambiguous serverless handler format will otherwise
cause Vercel to ignore it.

`ANTHROPIC_API_KEY` is only used server-side in the Vercel function and is
never exposed to the browser.

---

## Notes

- Flood zone and geology data come from real Environment Agency and BGS
  sources. The geology-to-subsidence-risk mapping is a simplified, indicative
  rule set, not a geotechnical survey — built for demonstration purposes
- Postcodes.io provides free UK geocoding with no rate limits for reasonable usage
- Mapbox free tier allows 50,000 map loads per month
