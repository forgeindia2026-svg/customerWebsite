import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}`;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSubscriber() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission denied');
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      setIsSubscribed(true);
      alert('Successfully subscribed to offers!');
    } catch (err) {
      console.error('Failed to subscribe:', err);
      alert('Failed to subscribe. Please ensure notifications are allowed for this site.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? () => {} : subscribe}
      disabled={isSubscribed || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSubscribed 
          ? 'bg-green-100 text-green-700 cursor-default' 
          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
      }`}
    >
      {isSubscribed ? <BellRing size={16} /> : <Bell size={16} />}
      {isSubscribed ? 'Subscribed to Offers' : loading ? 'Subscribing...' : 'Get Latest Offers!'}
    </button>
  );
}
