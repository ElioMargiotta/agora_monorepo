import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    "accountAssociation": {
      "header": "eyJmaWQiOjUyODQ4NCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDJmNkM3N2VlOGYwNmFGMGY0M2MwRTg3NWUyM2Q2QTYzODk1ZmI1MDkifQ",
      "payload": "eyJkb21haW4iOiJhZXF1aWxpYnJhLnZlcmNlbC5hcHAifQ",
      "signature": "CzBhcMqK8jq6LufuB0KB2xJTc2uemi1jVDxWiXlPpZUd1G/eakVgZrfUa0JdONDiEBiFZT9tJJrNu99IjwYTbhs="
    },
    "baseBuilder": {
      "allowedAddresses": ["0x328156F03D515DFf84201566429143632B87F70a"]
    },
    "miniapp": {
      "version": "1",
      "name": "Aequilibra",
      "homeUrl": "https://aequilibra.vercel.app",
      "iconUrl": "https://aequilibra.vercel.app/pepe.png",
      "splashImageUrl": "https://aequilibra.vercel.app/pepe.png",
      "splashBackgroundColor": "#000000",
      "webhookUrl": "https://aequilibra.vercel.app/api/webhook/farcaster",
      "subtitle": "Find the best funding across perps",
      "description": "Aggregate perpetual DEX funding rates. Compare pairs, track history, and build neutral strategies. Access GMX, dYdX, Perpetual Protocol and more.",
      "screenshotUrls": [
        "https://aequilibra.vercel.app/pepe.png"
      ],
      "primaryCategory": "finance",
      "tags": ["defi", "funding", "perpetuals", "arbitrage", "finance"],
      "heroImageUrl": "https://aequilibra.vercel.app/pepe.png",
      "tagline": "Smart funding arbitrage",
      "ogTitle": "Aequilibra - Find the best funding across perps",
      "ogDescription": "Aggregate perpetual DEX funding rates. Compare pairs, track history, and build neutral strategies.",
      "ogImageUrl": "https://aequilibra.vercel.app/pepe.png",
      "noindex": false
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}