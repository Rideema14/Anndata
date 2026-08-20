import { z } from 'zod';

export const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  days: z.coerce.number().int().min(1).max(16).default(7),
});
export type WeatherQuery = z.infer<typeof weatherQuerySchema>;
