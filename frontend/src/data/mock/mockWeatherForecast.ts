import type { LucideIcon } from 'lucide-react'
import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react'

export interface HourlyForecast {
  hour: string
  tempC: number
  icon: LucideIcon
  rainChancePercent: number
}

export interface DailyForecast {
  day: string
  icon: LucideIcon
  highC: number
  lowC: number
  rainChancePercent: number
}

export const currentWeather = {
  location: 'Katni, Madhya Pradesh',
  tempC: 31,
  feelsLikeC: 33,
  condition: 'Partly Cloudy',
  icon: CloudSun,
  humidityPercent: 68,
  windKmh: 14,
  rainChancePercent: 62,
}

export const hourlyForecast: HourlyForecast[] = [
  { hour: 'Now', tempC: 31, icon: CloudSun, rainChancePercent: 20 },
  { hour: '1 PM', tempC: 32, icon: Sun, rainChancePercent: 10 },
  { hour: '2 PM', tempC: 33, icon: Sun, rainChancePercent: 10 },
  { hour: '3 PM', tempC: 32, icon: CloudSun, rainChancePercent: 25 },
  { hour: '4 PM', tempC: 30, icon: Cloud, rainChancePercent: 45 },
  { hour: '5 PM', tempC: 28, icon: CloudRain, rainChancePercent: 60 },
  { hour: '6 PM', tempC: 27, icon: CloudRain, rainChancePercent: 65 },
  { hour: '7 PM', tempC: 26, icon: Cloud, rainChancePercent: 40 },
]

export const dailyForecast: DailyForecast[] = [
  { day: 'Today', icon: CloudSun, highC: 33, lowC: 24, rainChancePercent: 40 },
  { day: 'Tomorrow', icon: CloudRain, highC: 29, lowC: 23, rainChancePercent: 80 },
  { day: 'Wed', icon: CloudRain, highC: 28, lowC: 22, rainChancePercent: 70 },
  { day: 'Thu', icon: Cloud, highC: 30, lowC: 23, rainChancePercent: 35 },
  { day: 'Fri', icon: Sun, highC: 33, lowC: 24, rainChancePercent: 10 },
  { day: 'Sat', icon: Sun, highC: 34, lowC: 25, rainChancePercent: 5 },
  { day: 'Sun', icon: CloudSun, highC: 32, lowC: 24, rainChancePercent: 20 },
]

export const farmingAdvice = [
  'Rain expected tomorrow — hold off on irrigation today.',
  'High humidity increases fungal disease risk in soybean — inspect leaves this week.',
  'Wind speeds are safe for pesticide spraying this morning.',
]
