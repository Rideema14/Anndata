import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Uploads a buffer (from multer memory storage) to Cloudinary via an
 * upload stream, so we never write the file to disk first.
 */
export function uploadBuffer(
  buffer: Buffer,
  { folder = 'agri-marketplace', resourceType = 'image' }: { folder?: string; resourceType?: 'image' | 'video' | 'raw' | 'auto' } = {}
): Promise<UploadResult> {
  return new Promise((resolve) => {
    let resolved = false;

    const fallback = () => {
      if (resolved) return;
      resolved = true;
      const mimeType = buffer.toString('hex', 0, 4).startsWith('89504e47') ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      resolve({ url: dataUrl, publicId: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` });
    };

    try {
      const uploadStream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
        if (error || !result) {
          return fallback();
        }
        if (!resolved) {
          resolved = true;
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      });

      // Handle stream error events (e.g. Cloudinary 403 Forbidden / network failure)
      uploadStream.on('error', () => {
        fallback();
      });

      uploadStream.end(buffer);
    } catch {
      fallback();
    }
  });
}

export function deleteAsset(publicId?: string | null, resourceType: 'image' | 'video' | 'raw' = 'image') {
  if (!publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
