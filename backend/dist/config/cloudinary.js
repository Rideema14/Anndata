"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
exports.uploadBuffer = uploadBuffer;
exports.deleteAsset = deleteAsset;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const env_1 = require("./env");
const logger_1 = __importDefault(require("../common/utils/logger"));
cloudinary_1.v2.config({
    cloud_name: env_1.env.cloudinary.cloudName,
    api_key: env_1.env.cloudinary.apiKey,
    api_secret: env_1.env.cloudinary.apiSecret,
    secure: true,
});
/**
 * Uploads a buffer (from multer memory storage) to Cloudinary via an
 * upload stream, so we never write the file to disk first.
 */
function uploadBuffer(buffer, { folder = 'agri-marketplace', resourceType = 'image' } = {}) {
    return new Promise((resolve) => {
        let resolved = false;
        const fallback = (reason) => {
            if (resolved)
                return;
            resolved = true;
            // This silently keeps the app working (a base64 data: URI is still a
            // valid image source), but it means Cloudinary isn't actually
            // configured or reachable — surface that here, since otherwise the
            // only visible symptom is something downstream (like AI image
            // analysis) mysteriously not working, with no clue why.
            logger_1.default.warn(`Cloudinary upload failed, falling back to an inline data URI: ${reason}`);
            const mimeType = buffer.toString('hex', 0, 4).startsWith('89504e47') ? 'image/png' : 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
            resolve({ url: dataUrl, publicId: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` });
        };
        try {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
                if (error || !result) {
                    return fallback(error?.message || 'no result returned');
                }
                if (!resolved) {
                    resolved = true;
                    resolve({ url: result.secure_url, publicId: result.public_id });
                }
            });
            // Handle stream error events (e.g. Cloudinary 403 Forbidden / network failure)
            uploadStream.on('error', (err) => {
                fallback(err instanceof Error ? err.message : String(err));
            });
            uploadStream.end(buffer);
        }
        catch (err) {
            fallback(err instanceof Error ? err.message : String(err));
        }
    });
}
function deleteAsset(publicId, resourceType = 'image') {
    if (!publicId)
        return Promise.resolve();
    return cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
}
//# sourceMappingURL=cloudinary.js.map