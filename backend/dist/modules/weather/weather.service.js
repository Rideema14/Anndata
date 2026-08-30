"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeather = getWeather;
const prisma_1 = __importDefault(require("../../config/prisma"));
const env_1 = require("../../config/env");
const logger_1 = __importDefault(require("../../common/utils/logger"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
// WMO weather interpretation codes — the fixed standard Open-Meteo (and most
// national weather services) report weather_code against.
const WMO_CONDITIONS = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
};
function describeWeatherCode(code) {
    return WMO_CONDITIONS[code] || 'Unknown';
}
/** Rounds to ~1.1km precision — weather doesn't vary meaningfully at finer
 * granularity, and this keeps the cache from missing on every tiny GPS jitter. */
function buildLocationKey(lat, lng) {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}
const MAX_FETCH_DAYS = 16; // fetch the max once, slice per-request — keeps one cache entry useful for any requested range
async function fetchFromOpenMeteo(lat, lng) {
    const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
        timezone: 'auto',
        forecast_days: String(MAX_FETCH_DAYS),
    });
    const url = `${env_1.env.weather.baseUrl}?${params.toString()}`;
    let response;
    try {
        response = await fetch(url);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw ApiError_1.default.internal(`Could not reach the weather service: ${message}`);
    }
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        logger_1.default.error(`Open-Meteo request failed (${response.status}): ${body}`);
        throw ApiError_1.default.internal('Weather service returned an error.');
    }
    const data = (await response.json());
    const current = {
        time: data.current.time,
        temperatureC: data.current.temperature_2m,
        feelsLikeC: data.current.apparent_temperature,
        humidityPercent: data.current.relative_humidity_2m,
        precipitationMm: data.current.precipitation,
        windSpeedKmh: data.current.wind_speed_10m,
        windDirectionDeg: data.current.wind_direction_10m,
        weatherCode: data.current.weather_code,
        condition: describeWeatherCode(data.current.weather_code),
    };
    const daily = data.daily.time.map((date, i) => ({
        date,
        weatherCode: data.daily.weather_code[i],
        condition: describeWeatherCode(data.daily.weather_code[i]),
        tempMaxC: data.daily.temperature_2m_max[i],
        tempMinC: data.daily.temperature_2m_min[i],
        precipitationSumMm: data.daily.precipitation_sum[i],
        precipitationProbabilityMax: data.daily.precipitation_probability_max[i],
        windSpeedMaxKmh: data.daily.wind_speed_10m_max[i],
    }));
    return { current, daily };
}
async function getWeather(lat, lng, days) {
    const locationKey = buildLocationKey(lat, lng);
    const cached = await prisma_1.default.weatherCache.findUnique({ where: { locationKey } });
    if (cached && cached.expiresAt > new Date()) {
        return {
            current: cached.currentData,
            daily: cached.dailyData.slice(0, days),
            cached: true,
            fetchedAt: cached.fetchedAt,
        };
    }
    const { current, daily } = await fetchFromOpenMeteo(lat, lng);
    const expiresAt = new Date(Date.now() + env_1.env.weather.cacheTtlMinutes * 60_000);
    await prisma_1.default.weatherCache.upsert({
        where: { locationKey },
        update: { latitude: lat, longitude: lng, currentData: current, dailyData: daily, fetchedAt: new Date(), expiresAt },
        create: { locationKey, latitude: lat, longitude: lng, currentData: current, dailyData: daily, expiresAt },
    });
    return { current, daily: daily.slice(0, days), cached: false, fetchedAt: new Date() };
}
//# sourceMappingURL=weather.service.js.map