import { z } from 'zod';

export const NOTIFICATION_TYPES = ['ORDER_STATUS', 'PAYMENT', 'SELLER_VERIFICATION', 'REVIEW', 'PRICE_ALERT', 'GENERAL'] as const;

export const listNotificationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  mutedTypes: z.array(z.enum(NOTIFICATION_TYPES)).optional(),
});
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export const feedbackSchema = z.object({
  category: z.enum(['BUG', 'FEATURE_REQUEST', 'COMPLAINT', 'GENERAL']).default('GENERAL'),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(5).max(3000),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const respondFeedbackSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']),
  adminResponse: z.string().trim().max(3000).optional(),
});
export type RespondFeedbackInput = z.infer<typeof respondFeedbackSchema>;

export const listFeedbackQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
  category: z.enum(['BUG', 'FEATURE_REQUEST', 'COMPLAINT', 'GENERAL']).optional(),
});
export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>;
