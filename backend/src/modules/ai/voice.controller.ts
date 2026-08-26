import * as voiceService from './voice.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';
import type { VoiceQuery } from './ai.validation';

export const query = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  if (!req.file) throw ApiError.badRequest('No audio file uploaded. Use the "audio" field.');

  const { sessionId, synthesizeReply } = req.query as unknown as VoiceQuery;
  const result = await voiceService.handleVoiceQuery(
    req.user.id,
    req.file.buffer,
    req.file.originalname || 'voice-query.webm',
    req.file.mimetype,
    sessionId,
    synthesizeReply
  );
  ApiResponse.created(res, result, 'Voice query processed.');
});
