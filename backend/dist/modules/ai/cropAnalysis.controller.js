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
exports.remove = exports.getOne = exports.list = exports.weatherAdvice = exports.cropRotation = exports.irrigationAdvice = exports.fertilizerAdvice = exports.diseaseDetection = exports.cropAdvisor = void 0;
const cropAnalysisService = __importStar(require("./cropAnalysis.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
exports.cropAdvisor = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const analysis = await cropAnalysisService.getCropAdvice(req.user.id, req.body);
    ApiResponse_1.default.created(res, analysis, 'Crop recommendation ready.');
});
exports.diseaseDetection = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    if (!req.file)
        throw ApiError_1.default.badRequest('No image file uploaded. Use the "image" field.');
    const analysis = await cropAnalysisService.detectDisease(req.user.id, req.body, req.file.buffer);
    ApiResponse_1.default.created(res, analysis, 'Disease detection complete.');
});
exports.fertilizerAdvice = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const analysis = await cropAnalysisService.getFertilizerAdvice(req.user.id, req.body);
    ApiResponse_1.default.created(res, analysis, 'Fertilizer recommendation ready.');
});
exports.irrigationAdvice = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const analysis = await cropAnalysisService.getIrrigationAdvice(req.user.id, req.body);
    ApiResponse_1.default.created(res, analysis, 'Irrigation recommendation ready.');
});
exports.cropRotation = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const analysis = await cropAnalysisService.getCropRotationPlan(req.user.id, req.body);
    ApiResponse_1.default.created(res, analysis, 'Crop rotation plan ready.');
});
exports.weatherAdvice = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const analysis = await cropAnalysisService.getWeatherAdvice(req.user.id, req.body);
    ApiResponse_1.default.created(res, analysis, 'Weather-based recommendation ready.');
});
exports.list = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const { items, meta } = await cropAnalysisService.listCropAnalyses(req.user.id, req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.getOne = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const analysis = await cropAnalysisService.getCropAnalysisById(req.user.id, req.params.id);
    ApiResponse_1.default.ok(res, analysis);
});
exports.remove = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    await cropAnalysisService.deleteCropAnalysis(req.user.id, req.params.id);
    ApiResponse_1.default.noContent(res);
});
//# sourceMappingURL=cropAnalysis.controller.js.map