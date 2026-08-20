import * as weatherService from './weather.service';
import ApiResponse from '../../common/utils/ApiResponse';
import asyncHandler from '../../common/middlewares/asyncHandler';
import type { WeatherQuery } from './weather.validation';

export const getWeather = asyncHandler(async (req, res) => {
  const { lat, lng, days } = req.query as unknown as WeatherQuery;
  const weather = await weatherService.getWeather(lat, lng, days);
  ApiResponse.ok(res, weather);
});
