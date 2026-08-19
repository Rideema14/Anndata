import type { LucideIcon } from 'lucide-react'
import { CloudSun } from 'lucide-react'

export interface WeatherSnapshot {
  location: string
  tempC: number
  condition: string
  icon: LucideIcon
  rainChancePercent: number
  advice: string
}

export const mockWeatherSnapshot: WeatherSnapshot = {
  location: 'Katni, Madhya Pradesh',
  tempC: 31,
  condition: 'Partly Cloudy',
  icon: CloudSun,
  rainChancePercent: 62,
  advice: 'Rain expected tomorrow — you can skip irrigation today.',
}
