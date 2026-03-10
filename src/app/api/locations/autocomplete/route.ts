/**
 * POST /api/locations/autocomplete [module: api / locations]
 * Proxies the Google Places Autocomplete API to suggest location names
 * as the user types in the location search input.
 */
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_WEATHER_API_KEY;

interface PlacePrediction {
  placeId?: string;
  text?: { text?: string };
}

interface Suggestion {
  placePrediction?: PlacePrediction;
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  let body: { input?: string; sessionToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { input, sessionToken } = body;
  if (!input || input.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
      },
      body: JSON.stringify({
        input,
        sessionToken,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = (await res.json()) as { suggestions?: Suggestion[] };
    const suggestions = (data.suggestions ?? [])
      .filter((s) => s.placePrediction)
      .map((s) => ({
        placeId: s.placePrediction!.placeId ?? "",
        label: s.placePrediction!.text?.text ?? "",
      }))
      .filter((s) => s.placeId && s.label);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
