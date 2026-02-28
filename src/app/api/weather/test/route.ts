import { NextRequest, NextResponse } from "next/server";
import { getWeatherForLocation, formatWeatherForPrompt } from "@/lib/weather/getWeatherForLocation";

/**
 * 天气测试接口
 * GET /api/weather/test?lat=31.2304&lon=121.4737&date=2026-02-27
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const dateStr = searchParams.get("date");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: "lat and lon are required. e.g. ?lat=31.23&lon=121.47&date=2026-02-27" },
      { status: 400 }
    );
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  const weather = await getWeatherForLocation(lat, lon, date);

  if (!weather) {
    return NextResponse.json(
      { error: "Failed to fetch weather. Check API key or coordinates." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    input: { lat, lon, date: date.toISOString().slice(0, 10) },
    weather,
    promptString: formatWeatherForPrompt(weather),
  });
}
