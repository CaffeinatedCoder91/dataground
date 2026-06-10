# Dataground

A property risk intelligence tool for the UK insurance market.

Enter a UK postcode to see its location on a map alongside an AI-generated risk assessment covering flood, fire, and subsidence risk.

---

## What It Does

- Geocodes any UK postcode using the Postcodes.io API
- Plots the location on an interactive Mapbox map
- Generates a structured property risk assessment using Claude
- Returns flood risk, fire risk, subsidence risk, an overall score, and key risk factors

---

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **StyleX** — Meta's atomic CSS solution
- **Mapbox GL JS** — map rendering
- **Postcodes.io** — free UK geocoding, no API key required
- **Anthropic Claude** — AI risk analysis via Vercel serverless function
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
    risk-assessment.ts     # Vercel serverless function
  src/
    components/            # UI components (each with .stylex.ts and .test.tsx)
    hooks/                 # useGeocoding, useRiskAssessment
    styles/                # StyleX design tokens
    types/                 # TypeScript types
    utils/                 # Helper functions
    App.tsx
```

---

## Deployment

Deployed to Vercel. Add the following environment variables in your Vercel project settings:

```
VITE_MAPBOX_TOKEN=your_mapbox_public_token
ANTHROPIC_API_KEY=your_anthropic_api_key
```

The `ANTHROPIC_API_KEY` is only used server-side in the Vercel function and is never exposed to the browser.

---

## Notes

- Risk assessments are AI-generated based on geographic knowledge and are for demonstration purposes only
- Postcodes.io provides free UK geocoding with no rate limits for reasonable usage
- Mapbox free tier allows 50,000 map loads per month
