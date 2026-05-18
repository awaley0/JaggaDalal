import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer configuration - store in memory for Cloudinary processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.'));
  }
};

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

// Middleware to handle upload errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 10 files allowed.' });
    }
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};
