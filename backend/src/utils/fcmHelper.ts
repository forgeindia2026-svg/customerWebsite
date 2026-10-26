import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import User from '../models/User';

let firebaseApp: App | null = null;

// Attempt to locate a Firebase Service Account key file in the backend root
function initFirebaseAdmin(): App | null {
  if (firebaseApp) return firebaseApp;
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }

  try {
    const backendRoot = path.resolve(__dirname, '../../');
    const files = fs.readdirSync(backendRoot);
    const keyFile = files.find(f => (f.includes('firebase') || f.includes('serviceAccount') || f.includes('cctv-techapp')) && f.endsWith('.json'));

    if (keyFile) {
      const fullPath = path.join(backendRoot, keyFile);
      const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('[FCM] Firebase Admin initialized using: ' + keyFile);
      return firebaseApp;
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('[FCM] Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT env');
      return firebaseApp;
    } else {
      console.warn('[FCM] Notice: No service account JSON key found in backend root. Place your cctv-techapp serviceAccountKey.json in backend/');
      return null;
    }
  } catch (err) {
    console.error('[FCM] Firebase Admin init error:', err);
    return null;
  }
}

// Auto-initialize on import
initFirebaseAdmin();

export interface FcmCallPayload {
  toUserId: string;
  callerId: string;
  callerName: string;
  channel: string;
  withVideo?: boolean;
}

export const sendFcmCall = async (payload: FcmCallPayload) => {
  const app = initFirebaseAdmin();
  if (!app) return;

  try {
    const user = await User.findById(payload.toUserId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('[FCM Call] User ' + payload.toUserId + ' has no registered FCM tokens');
      return;
    }

    const message: MulticastMessage = {
      tokens: user.fcmTokens,
      data: {
        type: 'call',
        from: String(payload.callerId),
        fromName: String(payload.callerName || 'Technician'),
        channel: String(payload.channel),
        withVideo: payload.withVideo ? 'true' : 'false',
      },
      android: {
        priority: 'high',
        ttl: 30000,
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast(message);
    console.log('[FCM Call] Sent to ' + user.name + ': ' + response.successCount + ' success, ' + response.failureCount + ' failure');

    // Clean up stale or expired tokens
    if (response.failureCount > 0) {
      const validTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (resp.success) {
          validTokens.push(user.fcmTokens![idx]);
        }
      });
      user.fcmTokens = validTokens;
      await user.save();
    }
  } catch (err) {
    console.error('[FCM Call] Error:', err);
  }
};

export interface FcmMessagePayload {
  toUserId: string;
  senderName: string;
  messageText: string;
  roomId?: string;
}

export const sendFcmMessage = async (payload: FcmMessagePayload) => {
  const app = initFirebaseAdmin();
  if (!app) return;

  try {
    const user = await User.findById(payload.toUserId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

    const message: MulticastMessage = {
      tokens: user.fcmTokens,
      notification: {
        title: payload.senderName || 'New Message',
        body: payload.messageText || '',
      },
      data: {
        type: 'chat',
        title: payload.senderName || 'New Message',
        body: payload.messageText || '',
        targetRoute: '/chat',
        roomId: payload.roomId || '',
        channelId: 'chats_channel',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'chats_channel',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast(message);
    console.log('[FCM Message] Sent to ' + user.name + ': ' + response.successCount + ' success');
  } catch (err) {
    console.error('[FCM Message] Error:', err);
  }
};

export interface FcmNotificationPayload {
  toUserId: string;
  title: string;
  body: string;
  targetRoute?: string;
  channelId?: string;
  channelName?: string;
  data?: Record<string, string>;
}

export const sendFcmNotification = async (payload: FcmNotificationPayload) => {
  const app = initFirebaseAdmin();
  if (!app) return;

  try {
    const user = await User.findById(payload.toUserId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

    const channelId = payload.channelId || 'jobs_channel';
    const targetRoute = payload.targetRoute || '/home';

    const message: MulticastMessage = {
      tokens: user.fcmTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: 'alert',
        title: payload.title,
        body: payload.body,
        targetRoute: targetRoute,
        channelId: channelId,
        ...(payload.data || {}),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: channelId,
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast(message);
    console.log('[FCM Notification] Sent to ' + user.name + ' (' + payload.title + '): ' + response.successCount + ' success');

    if (response.failureCount > 0) {
      const validTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (resp.success) {
          validTokens.push(user.fcmTokens![idx]);
        }
      });
      user.fcmTokens = validTokens;
      await user.save();
    }
  } catch (err) {
    console.error('[FCM Notification] Error:', err);
  }
};

export interface FcmBroadcastPayload {
  title: string;
  body: string;
  targetRoute?: string;
  channelId?: string;
  data?: Record<string, string>;
}

export const sendFcmToAllTechnicians = async (payload: FcmBroadcastPayload) => {
  const app = initFirebaseAdmin();
  if (!app) return;

  try {
    const technicians = await User.find({ role: 'TECHNICIAN' });
    const allTokens: string[] = [];
    technicians.forEach(t => {
      if (t.fcmTokens && Array.isArray(t.fcmTokens)) {
        allTokens.push(...t.fcmTokens);
      }
    });

    const uniqueTokens = Array.from(new Set(allTokens));
    if (uniqueTokens.length === 0) {
      console.log('[FCM Broadcast] No technician FCM tokens registered.');
      return;
    }

    const channelId = payload.channelId || 'announcements_channel';
    const targetRoute = payload.targetRoute || '/announcements';

    const message: MulticastMessage = {
      tokens: uniqueTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: 'announcement',
        title: payload.title,
        body: payload.body,
        targetRoute: targetRoute,
        channelId: channelId,
        ...(payload.data || {}),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: channelId,
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast(message);
    console.log('[FCM Broadcast] Sent to ' + uniqueTokens.length + ' tokens: ' + response.successCount + ' success');
  } catch (err) {
    console.error('[FCM Broadcast] Error:', err);
  }
};
