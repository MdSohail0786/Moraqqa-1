import sharp from 'sharp';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_DIMENSION = 15000;
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

export function assertConfigured() {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, 'Image storage is not configured. Set the CLOUDINARY_* environment variables.');
  }
}

/** Verifies the real file content (not just the declared mime type) and its dimensions. */
export async function validateImageBuffer(buffer) {
  let meta;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw ApiError.badRequest('File is not a valid image');
  }
  if (!ALLOWED_FORMATS.includes(meta.format)) {
    throw ApiError.badRequest('Only JPG, PNG and WEBP images are allowed');
  }
  if (meta.width < MIN_WIDTH || meta.height < MIN_HEIGHT) {
    throw ApiError.badRequest(`Image is too small (minimum ${MIN_WIDTH}×${MIN_HEIGHT}px)`);
  }
  if (meta.width > MAX_DIMENSION || meta.height > MAX_DIMENSION) {
    throw ApiError.badRequest(`Image is too large (maximum ${MAX_DIMENSION}px on either side)`);
  }
  return { width: meta.width, height: meta.height, format: meta.format };
}

export const folderPath = (...parts) =>
  [env.cloudinary.rootFolder, ...parts.filter(Boolean)].join('/');

export function uploadBuffer(buffer, { folder, tags = [] } = {}) {
  assertConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        tags,
        // Keep the original, but never serve it directly: delivery URLs always carry transforms.
        quality: 'auto:best',
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export async function destroyAsset(publicId) {
  if (!publicId || !isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.error(`Cloudinary delete failed for ${publicId}:`, err.message);
  }
}

export async function destroyAssets(publicIds = []) {
  const ids = publicIds.filter(Boolean);
  if (!ids.length || !isCloudinaryConfigured) return;
  // Admin API accepts up to 100 ids per call.
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    try {
      // eslint-disable-next-line no-await-in-loop
      await cloudinary.api.delete_resources(chunk, { invalidate: true });
    } catch (err) {
      console.error('Cloudinary bulk delete failed:', err.message);
    }
  }
}

/** Run an async mapper over items with a fixed concurrency to avoid overloading the server. */
export async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      // eslint-disable-next-line no-await-in-loop
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
