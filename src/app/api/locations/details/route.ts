import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_WEATHER_API_KEY;

export async function GET(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  const sessionToken = searchParams.get("sessionToken");

  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  try {
    const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
    if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "id,formattedAddress,location",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Place details fetch failed" }, { status: res.status });
    }

    const data = (await res.json()) as {
      id?: string;
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    };

    return NextResponse.json({
      label: data.formattedAddress ?? "",
      lat: data.location?.latitude ?? null,
      lon: data.location?.longitude ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
