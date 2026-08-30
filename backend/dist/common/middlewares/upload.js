"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAudio = exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
// Files are held in memory only long enough to stream them to Cloudinary —
// nothing ever touches disk on our server.
const storage = multer_1.default.memoryStorage();
const imageFileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(ApiError_1.default.badRequest('Only image files are allowed.'));
    }
    cb(null, true);
};
exports.uploadImage = (0, multer_1.default)({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5MB per file, up to 8 files
});
const audioFileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('audio/')) {
        return cb(ApiError_1.default.badRequest('Only audio files are allowed.'));
    }
    cb(null, true);
};
// Used by the AI Advisory voice endpoint — a single short recording, not a batch.
exports.uploadAudio = (0, multer_1.default)({
    storage,
    fileFilter: audioFileFilter,
    limits: { fileSize: 15 * 1024 * 1024, files: 1 }, // 15MB — generous for a few minutes of speech
});
//# sourceMappingURL=upload.js.map