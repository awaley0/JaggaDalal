import { Router } from 'express';
import { uploadImages, handleUploadError } from '../middleware/imageUploadMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * POST /api/properties/upload-images
 * Upload property images with validation
 */
router.post(
  '/upload-images',
  authMiddleware,
  uploadImages.array('images', 10),
  handleUploadError,
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Convert uploaded files to URLs (in real app, upload to Cloudinary)
      const urls = req.files.map((file, index) => ({
        url: `/uploads/images/${Date.now()}-${index}.${file.mimetype.split('/')[1]}`,
        size: file.size,
        originalName: file.originalname,
      }));

      res.json({
        success: true,
        message: 'Images uploaded successfully',
        urls: urls,
        count: urls.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process images' });
    }
  }
);

export default router;
