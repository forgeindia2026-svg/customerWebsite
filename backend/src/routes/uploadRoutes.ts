import express, { Request, Response } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME as string,
    acl: 'public-read',
    metadata: function (req: any, file: any, cb: any) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req: any, file: any, cb: any) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const folder = req.body.folder || 'reports';
      cb(null, folder + '/' + uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-'));
    },
  }),
});

router.post('/', upload.single('image'), (req: Request, res: Response): any => {
  const reqAny = req as any;
  if (!reqAny.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const file: any = reqAny.file;
  res.json({ success: true, imageUrl: file.location });
});

export default router;
