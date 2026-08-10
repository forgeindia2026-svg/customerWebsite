import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';
import os from 'os';

export const processBase64Image = async (base64String: string): Promise<string> => {
  // If it's not a base64 string, return it as is (could be a regular URL)
  if (!base64String.startsWith('data:image')) {
    return base64String;
  }

  const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64String;
  }

  const imageBuffer = Buffer.from(matches[2], 'base64');
  const tmpFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.png`);
  
  try {
    // 1. Write buffer to temp file
    fs.writeFileSync(tmpFilePath, imageBuffer);
    
    // 2. Remove background
    const fileUri = `file:///${tmpFilePath.replace(/\\/g, '/')}`;
    const blob = await removeBackground(fileUri);
    const transparentBuffer = Buffer.from(await blob.arrayBuffer());
    
    // 3. Trim and pad
    const trimmed = await sharp(transparentBuffer).trim().toBuffer();
    const metadata = await sharp(trimmed).metadata();
    
    const maxDim = Math.max(metadata.width || 0, metadata.height || 0);
    const targetSize = Math.floor(maxDim * 1.15);
    
    const finalBuffer = await sharp(trimmed)
      .resize({
        width: metadata.width,
        height: metadata.height,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .extend({
        top: Math.floor((targetSize - (metadata.height || 0)) / 2),
        bottom: Math.ceil((targetSize - (metadata.height || 0)) / 2),
        left: Math.floor((targetSize - (metadata.width || 0)) / 2),
        right: Math.ceil((targetSize - (metadata.width || 0)) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 90 }) // Convert to JPEG to save space
      .toBuffer();
      
    // Return new base64 string
    return `data:image/jpeg;base64,${finalBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Image processing failed:', error);
    return base64String; // Fallback to original
  } finally {
    if (fs.existsSync(tmpFilePath)) {
      fs.unlinkSync(tmpFilePath);
    }
  }
};
