import webPush from 'web-push';
import User from '../models/User';
import dotenv from 'dotenv';
import { sendFcmNotification, sendFcmToAllTechnicians } from './fcmHelper';

dotenv.config();

// Configure Web Push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@skcctv.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys are missing in .env. Web Push will not work.');
}

export const sendPushToUser = async (userId: string, payload: any) => {
  try {
    // 1. Mobile FCM Push Notification (Android app background & closed delivery)
    sendFcmNotification({
      toUserId: userId,
      title: payload.title || 'SK CCTV Notification',
      body: payload.body || '',
      targetRoute: payload.targetRoute || payload.url || '/home',
      channelId: payload.channelId || 'jobs_channel',
      channelName: payload.channelName || 'Job Assignments',
      data: payload.data || {},
    }).catch(err => console.error('[pushHelper FCM error]:', err));

    // 2. Web Browser Push (for Web Admin / technicians on Chrome browser)
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const payloadString = JSON.stringify(payload);
    
    // Send to all active web push subscriptions of the user
    const sendPromises = user.pushSubscriptions.map(async (sub, index) => {
      try {
        await webPush.sendNotification(sub, payloadString);
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          user.pushSubscriptions!.splice(index, 1);
          await user.save();
        } else {
          console.error('Error sending web push notification to user', userId, err);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('sendPushToUser error:', error);
  }
};

export const sendPushToAllTechnicians = async (payload: any) => {
  try {
    // 1. Mobile FCM Broadcast (Android app background & closed delivery to all technicians)
    sendFcmToAllTechnicians({
      title: payload.title || 'SK CCTV Announcement',
      body: payload.body || '',
      targetRoute: payload.targetRoute || payload.url || '/announcements',
      channelId: payload.channelId || 'announcements_channel',
      data: payload.data || {},
    }).catch(err => console.error('[pushHelper FCM broadcast error]:', err));

    // 2. Web Browser Push to all technicians
    const users = await User.find({ role: 'TECHNICIAN' });
    const payloadString = JSON.stringify(payload);
    
    const sendPromises: Promise<void>[] = [];
    
    for (const user of users) {
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        user.pushSubscriptions.forEach((sub, index) => {
          sendPromises.push(
            webPush.sendNotification(sub, payloadString).catch(async (err: any) => {
              if (err.statusCode === 404 || err.statusCode === 410) {
                user.pushSubscriptions!.splice(index, 1);
                await user.save();
              }
            }) as Promise<void>
          );
        });
      }
    }
    
    await Promise.all(sendPromises);
  } catch (error) {
    console.error('sendPushToAll error:', error);
  }
};
