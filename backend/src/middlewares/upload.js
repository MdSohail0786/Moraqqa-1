import multer from 'multer';
import ApiError from '../utils/ApiError.js';

export const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
export const MAX_FILES_PER_REQUEST = 8; // the admin client sends larger selections in batches

// Files are held in memory only for the duration of the request, then streamed to Cloudinary.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(ApiError.badRequest(`${file.originalname}: only JPG, PNG and WEBP images are allowed`));
  }
  return cb(null, true);
};

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES_PER_REQUEST },
}).array('images', MAX_FILES_PER_REQUEST);

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single('image');
