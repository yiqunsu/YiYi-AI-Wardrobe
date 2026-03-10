/**
 * Weather data service using the Google Weather API.
 * Fetches current conditions (today) or forecast (up to 10 days ahead)
 * for a given latitude/longitude and date, and formats the result
 * as a compact summary string for use in LLM prompts.
 */

export interface WeatherSummary {
  tempMin: number;
  tempMax: number;
  condition: string;
  description: string;
  precipProbability: number;
  precipAmountMm: number;
  windSpeedKph: number;
  uvIndex: number;
}

/**
 * Formats a WeatherSummary into a single prompt-friendly string.
 * Example: "Partly sunny, 12–18°C | Rain 20% (0.5mm) | Wind 15 km/h | UV 3"
 */
export function formatWeatherForPrompt(w: WeatherSummary): string {
  const parts = [
    `${w.description}, ${w.tempMin}–${w.tempMax}°C`,
    `Rain ${w.precipProbability}%${w.precipAmountMm > 0 ? ` (${w.precipAmountMm.toFixed(1)}mm)` : ""}`,
    `Wind ${w.windSpeedKph} km/h`,
    `UV ${w.uvIndex}`,
  ];
  return parts.join(" | ");
}

const API_KEY = process.env.GOOGLE_WEATHER_API_KEY;
const BASE = "https://weather.googleapis.com/v1";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface GoogleWeatherCondition {
  type?: string;
  description?: { text?: string };
}
interface GoogleDegrees {
  degrees?: number;
}
interface GoogleSpeed {
  value?: number;
  unit?: string;
}
interface GooglePrecipitation {
  probability?: { percent?: number };
  qpf?: { quantity?: number; unit?: string };
}

interface CurrentConditionsResponse {
  temperature?: GoogleDegrees;
  weatherCondition?: GoogleWeatherCondition;
  uvIndex?: number;
  precipitation?: GooglePrecipitation;
  wind?: { speed?: GoogleSpeed };
  currentConditionsHistory?: {
    maxTemperature?: GoogleDegrees;
    minTemperature?: GoogleDegrees;
  };
}

interface ForecastPeriod {
  weatherCondition?: GoogleWeatherCondition;
  uvIndex?: number;
  precipitation?: GooglePrecipitation;
  wind?: { speed?: GoogleSpeed };
}

interface ForecastDay {
  displayDate?: { year?: number; month?: number; day?: number };
  maxTemperature?: GoogleDegrees;
  minTemperature?: GoogleDegrees;
  daytimeForecast?: ForecastPeriod;
  nighttimeForecast?: ForecastPeriod;
}

interface ForecastDaysResponse {
  forecastDays?: ForecastDay[];
}

function toKph(value: number, unit?: string): number {
  if (unit === "MILES_PER_HOUR") return Math.round(value * 1.60934);
  return Math.round(value);
}

/**
 * Returns a WeatherSummary for the given location and date.
 * Uses currentConditions for today, forecast/days for future dates (1–10 days ahead).
 * Returns null if the API key is missing, coordinates are invalid, or the request fails.
 */
export async function getWeatherForLocation(
  lat: number,
  lon: number,
  date: Date
): Promise<WeatherSummary | null> {
  if (!API_KEY || typeof lat !== "number" || typeof lon !== "number")
    return null;

  const today = new Date();

  try {
    if (isSameDay(date, today)) {
      const url = `${BASE}/currentConditions:lookup?key=${API_KEY}&location.latitude=${lat}&location.longitude=${lon}`;
      const res = await fetch(url);
      if (!res.ok) return null;

      const d = (await res.json()) as CurrentConditionsResponse;
      const temp = d.temperature?.degrees ?? 15;
      const tempMin =
        d.currentConditionsHistory?.minTemperature?.degrees ?? temp - 2;
      const tempMax =
        d.currentConditionsHistory?.maxTemperature?.degrees ?? temp + 2;

      return {
        tempMin: Math.round(tempMin),
        tempMax: Math.round(tempMax),
        condition: d.weatherCondition?.type ?? "CLEAR",
        description: d.weatherCondition?.description?.text ?? "Clear",
        precipProbability: d.precipitation?.probability?.percent ?? 0,
        precipAmountMm: d.precipitation?.qpf?.quantity ?? 0,
        windSpeedKph: toKph(
          d.wind?.speed?.value ?? 0,
          d.wind?.speed?.unit
        ),
        uvIndex: d.uvIndex ?? 0,
      };
    } else {
      const msDiff = date.getTime() - today.getTime();
      const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      if (daysDiff <= 0 || daysDiff > 10) return null;

      const url = `${BASE}/forecast/days:lookup?key=${API_KEY}&location.latitude=${lat}&location.longitude=${lon}&days=${daysDiff + 1}`;
      const res = await fetch(url);
      if (!res.ok) return null;

      const data = (await res.json()) as ForecastDaysResponse;
      const forecastDays = data.forecastDays;
      if (!Array.isArray(forecastDays) || forecastDays.length === 0)
        return null;

      const targetYear = date.getFullYear();
      const targetMonth = date.getMonth() + 1;
      const targetDay = date.getDate();

      const day =
        forecastDays.find(
          (d) =>
            d.displayDate?.year === targetYear &&
            d.displayDate?.month === targetMonth &&
            d.displayDate?.day === targetDay
        ) ?? forecastDays[forecastDays.length - 1];

      const period = day.daytimeForecast ?? day.nighttimeForecast;

      return {
        tempMin: Math.round(day.minTemperature?.degrees ?? 10),
        tempMax: Math.round(day.maxTemperature?.degrees ?? 20),
        condition: period?.weatherCondition?.type ?? "CLEAR",
        description:
          day.daytimeForecast?.weatherCondition?.description?.text ??
          day.nighttimeForecast?.weatherCondition?.description?.text ??
          "Clear",
        precipProbability: period?.precipitation?.probability?.percent ?? 0,
        precipAmountMm: period?.precipitation?.qpf?.quantity ?? 0,
        windSpeedKph: toKph(
          period?.wind?.speed?.value ?? 0,
          period?.wind?.speed?.unit
        ),
        uvIndex: period?.uvIndex ?? 0,
      };
    }
  } catch {
    return null;
  }
}
