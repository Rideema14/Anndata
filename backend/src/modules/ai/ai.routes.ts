import { Router } from 'express';
import { z } from 'zod';
import * as chatController from './chatSession.controller';
import * as cropAnalysisController from './cropAnalysis.controller';
import * as soilReportController from './soilReport.controller';
import * as voiceController from './voice.controller';
import * as historyController from './history.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { aiLimiter } from '../../common/middlewares/rateLimiters';
import { uploadImage, uploadAudio } from '../../common/middlewares/upload';
import {
  sendChatMessageSchema,
  listChatSessionsQuerySchema,
  cropAdvisorSchema,
  diseaseDetectionSchema,
  fertilizerAdviceSchema,
  irrigationAdviceSchema,
  cropRotationSchema,
  weatherAdviceSchema,
  listCropAnalysesQuerySchema,
  soilAnalysisSchema,
  voiceQuerySchema,
  historyQuerySchema,
} from './ai.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate, aiLimiter);

// --- Chat --------------------------------------------------------------

router.get('/chat/sessions', validate({ query: listChatSessionsQuerySchema }), chatController.list);
router.post('/chat/sessions', chatController.create);
router.get('/chat/sessions/:id', validate({ params: idParamSchema }), chatController.getOne);
router.delete('/chat/sessions/:id', validate({ params: idParamSchema }), chatController.remove);

/**
 * @openapi
 * /ai/chat/sessions/{id}/messages:
 *   post:
 *     tags: [AI Advisory]
 *     summary: Send a message in a chat session and get the AI's reply (both persisted)
 */
router.post(
  '/chat/sessions/:id/messages',
  validate({ params: idParamSchema, body: sendChatMessageSchema }),
  chatController.sendMessage
);

// --- Crop analysis (six advisory types) ---------------------------------

/**
 * @openapi
 * /ai/crop-advisor:
 *   post:
 *     tags: [AI Advisory]
 *     summary: General planting/crop recommendations for given conditions
 */
router.post('/crop-advisor', validate({ body: cropAdvisorSchema }), cropAnalysisController.cropAdvisor);

/**
 * @openapi
 * /ai/disease-detection:
 *   post:
 *     tags: [AI Advisory]
 *     summary: Image-based crop disease/pest identification (multipart field "image")
 */
router.post(
  '/disease-detection',
  uploadImage.single('image'),
  validate({ body: diseaseDetectionSchema }),
  cropAnalysisController.diseaseDetection
);

router.post('/fertilizer-advice', validate({ body: fertilizerAdviceSchema }), cropAnalysisController.fertilizerAdvice);

router.post('/irrigation-advice', validate({ body: irrigationAdviceSchema }), cropAnalysisController.irrigationAdvice);

router.post('/crop-rotation', validate({ body: cropRotationSchema }), cropAnalysisController.cropRotation);

/**
 * @openapi
 * /ai/weather-advice:
 *   post:
 *     tags: [AI Advisory]
 *     summary: Weather-correlated recommendations — internally fetches a real forecast for the given coordinates
 */
router.post('/weather-advice', validate({ body: weatherAdviceSchema }), cropAnalysisController.weatherAdvice);

router.get('/crop-analyses', validate({ query: listCropAnalysesQuerySchema }), cropAnalysisController.list);
router.get('/crop-analyses/:id', validate({ params: idParamSchema }), cropAnalysisController.getOne);
router.delete('/crop-analyses/:id', validate({ params: idParamSchema }), cropAnalysisController.remove);

// --- Soil analysis -----------------------------------------------------

router.post('/soil-analysis', validate({ body: soilAnalysisSchema }), soilReportController.analyze);
router.get('/soil-reports', soilReportController.list);
router.get('/soil-reports/:id', validate({ params: idParamSchema }), soilReportController.getOne);
router.delete('/soil-reports/:id', validate({ params: idParamSchema }), soilReportController.remove);

// --- Voice ---------------------------------------------------------------

/**
 * @openapi
 * /ai/voice:
 *   post:
 *     tags: [AI Advisory]
 *     summary: Speech-based interaction — transcribes an uploaded recording (multipart field "audio"), routes it through the chat pipeline, optionally returns a synthesized spoken reply
 */
router.post('/voice', uploadAudio.single('audio'), validate({ query: voiceQuerySchema }), voiceController.query);

// --- Unified history -----------------------------------------------------

/**
 * @openapi
 * /ai/history:
 *   get:
 *     tags: [AI Advisory]
 *     summary: Recent AI interactions merged across chat sessions, crop analyses, and soil reports
 */
router.get('/history', validate({ query: historyQuerySchema }), historyController.getHistory);

export default router;
