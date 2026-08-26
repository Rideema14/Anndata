import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import ApiError from '../utils/ApiError';

// Files are held in memory only long enough to stream them to Cloudinary —
// nothing ever touches disk on our server.
const storage = multer.memoryStorage();

const imageFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(ApiError.badRequest('Only image files are allowed.'));
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5MB per file, up to 8 files
});

const audioFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!file.mimetype.startsWith('audio/')) {
    return cb(ApiError.badRequest('Only audio files are allowed.'));
  }
  cb(null, true);
};

// Used by the AI Advisory voice endpoint — a single short recording, not a batch.
export const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 15 * 1024 * 1024, files: 1 }, // 15MB — generous for a few minutes of speech
});
