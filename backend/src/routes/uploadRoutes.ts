import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('image'), (req: Request, res: Response): any => {
  const reqAny = req as any;
  if (!reqAny.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const file: any = reqAny.file;
  
  // Construct a full URL so the frontend accepts it as a valid image URL
  const host = process.env.API_URL || req.protocol + '://' + req.get('host');
  const imageUrl = `${host}/uploads/reports/${file.filename}`;
  
  res.json({ success: true, imageUrl: imageUrl });
});

export default router;
