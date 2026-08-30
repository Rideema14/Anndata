"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const chatController = __importStar(require("./chatSession.controller"));
const cropAnalysisController = __importStar(require("./cropAnalysis.controller"));
const soilReportController = __importStar(require("./soilReport.controller"));
const voiceController = __importStar(require("./voice.controller"));
const historyController = __importStar(require("./history.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const rateLimiters_1 = require("../../common/middlewares/rateLimiters");
const upload_1 = require("../../common/middlewares/upload");
const ai_validation_1 = require("./ai.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
router.use(authenticate_1.authenticate, rateLimiters_1.aiLimiter);
// --- Chat --------------------------------------------------------------
router.get('/chat/sessions', (0, validate_1.default)({ query: ai_validation_1.listChatSessionsQuerySchema }), chatController.list);
router.post('/chat/sessions', chatController.create);
router.get('/chat/sessions/:id', (0, validate_1.default)({ params: idParamSchema }), chatController.getOne);
router.delete('/chat/sessions/:id', (0, validate_1.default)({ params: idParamSchema }), chatController.remove);
/**
 * @openapi
 * /ai/chat/sessions/{id}/messages:
 *   post:
 *     tags: [AI Advisory]
 *     summary: Send a message in a chat session and get the AI's reply (both persisted)
 */
router.post('/chat/sessions/:id/messages', (0, validate_1.default)({ params: idParamSchema, body: ai_validation_1.sendChatMessageSchema }), chatController.sendMessage);
// --- Crop analysis (six advisory types) ---------------------------------
/**
 * @openapi
 * /ai/crop-advisor:
 *   post:
 *     tags: [AI Advisory]
 *     summary: General planting/crop recommendations for given conditions
 */
router.post('/crop-advisor', (0, validate_1.default)({ body: ai_validation_1.cropAdvisorSchema }), cropAnalysisController.cropAdvisor);
/**
 * @openapi
 * /ai/disease-detection:
 *   post:
 *     tags: [AI Advisory]
 *     summary: Image-based crop disease/pest identification (multipart field "image")
 */
router.post('/disease-detection', upload_1.uploadImage.single('image'), (0, validate_1.default)({ body: ai_validation_1.diseaseDetectionSchema }), cropAnalysisController.diseaseDetection);
router.post('/fertilizer-advice', (0, validate_1.default)({ body: ai_validation_1.fertilizerAdviceSchema }), cropAnalysisController.fertilizerAdvice);
router.post('/irrigation-advice', (0, validate_1.default)({ body: ai_validation_1.irrigationAdviceSchema }), cropAnalysisController.irrigationAdvice);
router.post('/crop-rotation', (0, validate_1.default)({ body: ai_validation_1.cropRotationSchema }), cropAnalysisController.cropRotation);
/**
 * @openapi
 * /ai/weather-advice:
 *   post:
 *     tags: [AI Advisory]
 *     summary: Weather-correlated recommendations — internally fetches a real forecast for the given coordinates
 */
router.post('/weather-advice', (0, validate_1.default)({ body: ai_validation_1.weatherAdviceSchema }), cropAnalysisController.weatherAdvice);
router.get('/crop-analyses', (0, validate_1.default)({ query: ai_validation_1.listCropAnalysesQuerySchema }), cropAnalysisController.list);
router.get('/crop-analyses/:id', (0, validate_1.default)({ params: idParamSchema }), cropAnalysisController.getOne);
router.delete('/crop-analyses/:id', (0, validate_1.default)({ params: idParamSchema }), cropAnalysisController.remove);
// --- Soil analysis -----------------------------------------------------
router.post('/soil-analysis', (0, validate_1.default)({ body: ai_validation_1.soilAnalysisSchema }), soilReportController.analyze);
router.get('/soil-reports', soilReportController.list);
router.get('/soil-reports/:id', (0, validate_1.default)({ params: idParamSchema }), soilReportController.getOne);
router.delete('/soil-reports/:id', (0, validate_1.default)({ params: idParamSchema }), soilReportController.remove);
// --- Voice ---------------------------------------------------------------
/**
 * @openapi
 * /ai/voice:
 *   post:
 *     tags: [AI Advisory]
 *     summary: Speech-based interaction — transcribes an uploaded recording (multipart field "audio"), routes it through the chat pipeline, optionally returns a synthesized spoken reply
 */
router.post('/voice', upload_1.uploadAudio.single('audio'), (0, validate_1.default)({ query: ai_validation_1.voiceQuerySchema }), voiceController.query);
// --- Unified history -----------------------------------------------------
/**
 * @openapi
 * /ai/history:
 *   get:
 *     tags: [AI Advisory]
 *     summary: Recent AI interactions merged across chat sessions, crop analyses, and soil reports
 */
router.get('/history', (0, validate_1.default)({ query: ai_validation_1.historyQuerySchema }), historyController.getHistory);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map