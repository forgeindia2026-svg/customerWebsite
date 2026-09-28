import { Router, Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

const router = Router();

const APP_ID = process.env.AGORA_APP_ID || '';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

// Generate Agora RTC Token
// POST /api/agora/token
// Body: { channelName, uid }
router.post('/token', (req: Request, res: Response) => {
  try {
    const { channelName, uid } = req.body;

    if (!channelName || uid === undefined) {
      return res.status(400).json({ success: false, message: 'channelName and uid are required' });
    }

    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ success: false, message: 'Agora credentials not configured' });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    res.json({ success: true, token, appId: APP_ID });
  } catch (error: any) {
    console.error('Agora token error:', error);
    res.status(500).json({ success: false, message: error.message || 'Token generation failed' });
  }
});

// GET /api/agora/app-id - Just return App ID for client-side
router.get('/app-id', (_req: Request, res: Response) => {
  if (!APP_ID) {
    return res.status(500).json({ success: false, message: 'Agora not configured' });
  }
  res.json({ success: true, appId: APP_ID });
});

export default router;
