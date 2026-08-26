import * as chatSessionService from './chatSession.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await chatSessionService.listSessions(req.user.id, req.query);
  ApiResponse.paginated(res, items, meta);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const session = await chatSessionService.createSession(req.user.id);
  ApiResponse.created(res, session, 'Chat session started.');
});

export const getOne = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const session = await chatSessionService.getSession(req.user.id, req.params.id);
  ApiResponse.ok(res, session);
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await chatSessionService.deleteSession(req.user.id, req.params.id);
  ApiResponse.noContent(res);
});

export const sendMessage = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const result = await chatSessionService.sendMessage(req.user.id, req.params.id, req.body.content);
  ApiResponse.created(res, result, 'Message sent.');
});
