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
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
      if (error || !result) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    uploadStream.end(buffer);
  });
}

export function deleteAsset(publicId?: string | null, resourceType: 'image' | 'video' | 'raw' = 'image') {
  if (!publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
