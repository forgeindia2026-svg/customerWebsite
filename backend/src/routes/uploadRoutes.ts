import express, { Request, Response } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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
    contentType: multerS3.AUTO_CONTENT_TYPE,
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
  res.json({ success: true, imageUrl: file.location, url: file.location, key: file.key });
});

// Proxy Image endpoint to bypass browser CORS when embedding S3 photos in jsPDF reports
router.get('/proxy-image', async (req: Request, res: Response): Promise<any> => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'Missing url query parameter' });
    }

    // If URL points to AWS S3, fetch directly from S3 using IAM credentials
    const bucketName = process.env.AWS_BUCKET_NAME || '';
    if (bucketName && (targetUrl.includes(bucketName) || targetUrl.includes('.amazonaws.com/'))) {
      try {
        let key = targetUrl;
        if (key.includes('.amazonaws.com/')) {
          key = key.split('.amazonaws.com/')[1];
        } else {
          try {
            const parsed = new URL(key);
            key = parsed.pathname.replace(/^\//, '');
          } catch {}
        }
        // Remove leading slash and query params
        key = decodeURIComponent(key.split('?')[0].replace(/^\//, ''));

        const s3Res = await s3.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        }));

        if (s3Res.Body) {
          const bytes = await s3Res.Body.transformToByteArray();
          const contentType = s3Res.ContentType || 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(Buffer.from(bytes));
        }
      } catch (s3Err) {
        console.warn('S3 direct fetch fallback:', s3Err);
      }
    }

    // Fallback: fetch directly via Node HTTP fetch (no browser CORS restrictions)
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: `Failed to fetch image: ${response.statusText}` });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Image proxy error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Image proxy failed' });
  }
});

export default router;
