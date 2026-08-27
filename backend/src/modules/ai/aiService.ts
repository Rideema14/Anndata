import { api } from './api'
import type { PaginationMeta } from './productService'

/* =========================================================================
 * Current UI language — attached to every AI request below so replies with
 * no free-text field to detect language from (e.g. a crop advisor form
 * filled entirely with dropdowns) still come back in the right language
 * instead of silently defaulting to English. Requests that do carry free
 * text (chat, notes fields, voice transcripts) still let that text win —
 * this is just the fallback signal.
 * ====================================================================== */

const LANGUAGE_STORAGE_KEY = 'aandata.language' // must match LanguageContext's STORAGE_KEY
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  pa: 'Punjabi',
  gu: 'Gujarati',
}

function getCurrentLanguageName(): string {
  try {
    const code = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return (code && LANGUAGE_NAMES[code]) || 'English'
  } catch {
    return 'English'
  }
}

/* =========================================================================
 * Shared advisory result shape
 * ====================================================================== */

export type Confidence = 'low' | 'medium' | 'high'

export interface AdvisoryResult {
  summary: string
  recommendations?: string[]
  warnings?: string[]
  confidence?: Confidence
  // type-specific extras (present depending on which endpoint produced it)
  recommendedCrops?: string[]
  diseaseName?: string | null
  isHealthy?: boolean
  npkGuidance?: string
  suggestedSchedule?: string
  suggestedNextCrops?: string[]
  rotationPlan?: string
  suitableCrops?: string[]
  amendments?: string[]
}

interface BackendCropAnalysis {
  id: string
  type: 'CROP_ADVISOR' | 'DISEASE_DETECTION' | 'FERTILIZER_ADVICE' | 'IRRIGATION_ADVICE' | 'CROP_ROTATION' | 'WEATHER_ADVICE'
  imageUrl?: string | null
  resultSummary: string
  resultData: AdvisoryResult
  createdAt: string
}

interface BackendSoilReport {
  id: string
  soilPh?: number | null
  nitrogenLevel?: 'Low' | 'Medium' | 'High' | null
  phosphorusLevel?: 'Low' | 'Medium' | 'High' | null
  potassiumLevel?: 'Low' | 'Medium' | 'High' | null
  organicCarbonPercent?: number | null
  soilType?: string | null
  location?: string | null
  recommendationSummary: string
  recommendationData: AdvisoryResult
  createdAt: string
}

/* =========================================================================
 * Crop analysis (crop advisor, disease detection, fertilizer, irrigation,
 * crop rotation, weather advice) — six one-shot advisory types
 * ====================================================================== */

export interface CropAdvisorInput {
  cropType?: string
  location?: string
  season?: string
  soilType?: string
  farmSizeAcres?: number
  notes?: string
}
export interface FertilizerAdviceInput {
  cropType: string
  soilType?: string
  growthStage?: string
  notes?: string
}
export interface IrrigationAdviceInput {
  cropType: string
  soilType?: string
  location?: string
  notes?: string
}
export interface CropRotationInput {
  currentCrop: string
  location?: string
  soilType?: string
  previousCrops?: string[]
  notes?: string
}
export interface WeatherAdviceInput {
  latitude: number
  longitude: number
  cropType?: string
}

export const cropAnalysisService = {
  async cropAdvisor(input: CropAdvisorInput): Promise<AdvisoryResult> {
    const res = await api.post<{ data: BackendCropAnalysis }>('/ai/crop-advisor', { ...input, language: getCurrentLanguageName() })
    return res.data.data.resultData
  },

  async diseaseDetection(image: File, extra: { cropType?: string; notes?: string } = {}): Promise<AdvisoryResult & { imageUrl?: string }> {
    const form = new FormData()
    form.append('image', image)
    if (extra.cropType) form.append('cropType', extra.cropType)
    if (extra.notes) form.append('notes', extra.notes)
    form.append('language', getCurrentLanguageName())
    const res = await api.post<{ data: BackendCropAnalysis }>('/ai/disease-detection', form)
    return { ...res.data.data.resultData, imageUrl: res.data.data.imageUrl ?? undefined }
  },

  async fertilizerAdvice(input: FertilizerAdviceInput): Promise<AdvisoryResult> {
    const res = await api.post<{ data: BackendCropAnalysis }>('/ai/fertilizer-advice', { ...input, language: getCurrentLanguageName() })
    return res.data.data.resultData
  },

  async irrigationAdvice(input: IrrigationAdviceInput): Promise<AdvisoryResult> {
    const res = await api.post<{ data: BackendCropAnalysis }>('/ai/irrigation-advice', { ...input, language: getCurrentLanguageName() })
    return res.data.data.resultData
  },

  async cropRotation(input: CropRotationInput): Promise<AdvisoryResult> {
    const res = await api.post<{ data: BackendCropAnalysis }>('/ai/crop-rotation', { ...input, language: getCurrentLanguageName() })
    return res.data.data.resultData
  },

  async weatherAdvice(input: WeatherAdviceInput): Promise<AdvisoryResult> {
    const res = await api.post<{ data: BackendCropAnalysis }>('/ai/weather-advice', { ...input, language: getCurrentLanguageName() })
    return res.data.data.resultData
  },

  async list(params: { page?: number; limit?: number; type?: BackendCropAnalysis['type'] } = {}) {
    const res = await api.get<{ data: BackendCropAnalysis[]; meta: { pagination: PaginationMeta } }>('/ai/crop-analyses', {
      params,
    })
    return { items: res.data.data, meta: res.data.meta.pagination }
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/ai/crop-analyses/${id}`)
  },
}

/* =========================================================================
 * Soil analysis
 * ====================================================================== */

export interface SoilAnalysisInput {
  soilPh?: number
  nitrogenLevel?: 'Low' | 'Medium' | 'High'
  phosphorusLevel?: 'Low' | 'Medium' | 'High'
  potassiumLevel?: 'Low' | 'Medium' | 'High'
  organicCarbonPercent?: number
  soilType?: string
  location?: string
  latitude?: number
  longitude?: number
  notes?: string
}

export const soilService = {
  async analyze(input: SoilAnalysisInput): Promise<AdvisoryResult> {
    const res = await api.post<{ data: BackendSoilReport }>('/ai/soil-analysis', { ...input, language: getCurrentLanguageName() })
    return res.data.data.recommendationData
  },

  async list(params: { page?: number; limit?: number } = {}) {
    const res = await api.get<{ data: BackendSoilReport[]; meta: { pagination: PaginationMeta } }>('/ai/soil-reports', {
      params,
    })
    return { items: res.data.data, meta: res.data.meta.pagination }
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/ai/soil-reports/${id}`)
  },
}

/* =========================================================================
 * Chat
 * ====================================================================== */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
interface BackendChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}
interface BackendChatSession {
  id: string
  title?: string | null
  updatedAt: string
  messages?: BackendChatMessage[]
}
export interface ChatSession {
  id: string
  title: string
  updatedAt: string
  lastMessage?: string
}

function mapMessage(m: BackendChatMessage): ChatMessage {
  return { id: m.id, role: m.role === 'USER' ? 'user' : 'assistant', content: m.content, createdAt: m.createdAt }
}
function mapSession(s: BackendChatSession): ChatSession {
  return {
    id: s.id,
    title: s.title || 'New chat',
    updatedAt: s.updatedAt,
    lastMessage: s.messages?.[0]?.content,
  }
}

export const chatService = {
  async listSessions(): Promise<ChatSession[]> {
    const res = await api.get<{ data: BackendChatSession[] }>('/ai/chat/sessions', { params: { limit: 50 } })
    return res.data.data.map(mapSession)
  },

  async createSession(): Promise<ChatSession> {
    const res = await api.post<{ data: BackendChatSession }>('/ai/chat/sessions')
    return mapSession(res.data.data)
  },

  async getSession(id: string): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
    const res = await api.get<{ data: BackendChatSession & { messages: BackendChatMessage[] } }>(`/ai/chat/sessions/${id}`)
    return { session: mapSession(res.data.data), messages: (res.data.data.messages ?? []).map(mapMessage) }
  },

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/ai/chat/sessions/${id}`)
  },

  async sendMessage(sessionId: string, content: string): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const res = await api.post<{ data: { userMessage: BackendChatMessage; assistantMessage: BackendChatMessage } }>(
      `/ai/chat/sessions/${sessionId}/messages`,
      { content },
    )
    return { userMessage: mapMessage(res.data.data.userMessage), assistantMessage: mapMessage(res.data.data.assistantMessage) }
  },
}

/* =========================================================================
 * Voice
 * ====================================================================== */

export interface VoiceResult {
  transcript: string
  replyText: string
  replyAudioUrl?: string
  sessionId: string
}

export const voiceService = {
  async query(audio: Blob, filename: string, opts: { sessionId?: string; synthesizeReply?: boolean } = {}): Promise<VoiceResult> {
    const form = new FormData()
    form.append('audio', audio, filename)
    const params: Record<string, string> = {}
    if (opts.sessionId) params.sessionId = opts.sessionId
    params.synthesizeReply = opts.synthesizeReply === false ? 'false' : 'true'
    const res = await api.post<{ data: VoiceResult }>('/ai/voice', form, { params })
    return res.data.data
  },
}

/* =========================================================================
 * Unified history
 * ====================================================================== */

export interface HistoryItem {
  id: string
  kind: 'CROP_ANALYSIS' | 'SOIL_REPORT' | 'CHAT'
  subtype?: string
  summary: string
  createdAt: string
}

export const historyService = {
  async getHistory(limit = 20): Promise<HistoryItem[]> {
    const res = await api.get<{ data: HistoryItem[] }>('/ai/history', { params: { limit } })
    return res.data.data
  },
}

/* =========================================================================
 * Geolocation helper (used by weather-driven advice)
 * ====================================================================== */

const FALLBACK_COORDS = { latitude: 28.6139, longitude: 77.209 } // New Delhi

export function getCurrentCoords(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(FALLBACK_COORDS)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(FALLBACK_COORDS),
    )
  })
}
