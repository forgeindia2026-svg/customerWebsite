import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_BUCKET_NAME || 'sk-cctv-storage-2026';

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const uploadBufferToS3 = async (buffer: Buffer, mimeType: string = 'image/jpeg'): Promise<string> => {
  const fileName = `products/${Date.now()}-${Math.floor(Math.random() * 100000)}.jpg`;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    }));

    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    console.log('Successfully uploaded image to AWS S3:', s3Url);
    return s3Url;
  } catch (error) {
    console.error('AWS S3 upload error:', error);
    // Fallback to base64 data url if S3 upload fails
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
};

export const uploadBase64ToS3 = async (base64String: string): Promise<string> => {
  if (!base64String || (!base64String.startsWith('data:image') && !base64String.startsWith('blob:'))) {
    return base64String;
  }

  try {
    const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = `image/${matches[1]}`;
      const imageBuffer = Buffer.from(matches[2], 'base64');
      return await uploadBufferToS3(imageBuffer, mimeType);
    }
  } catch (err) {
    console.error('Base64 to S3 error:', err);
  }

  return base64String;
};
