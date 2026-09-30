import { useEffect } from 'react';

// VAPID Public Key from backend .env
const VAPID_PUBLIC_KEY = 'BKyloYfUS1ID7XKMiyut_CglpHzMSSji7AsFFgcNuXRJOdWE0krOvHj2BcbJcp7E2JiUveFMDwgoOOrM5hZUrOQ';
const API_URL = import.meta.env.VITE_API_URL || 'https://43.204.218.193.sslip.io';

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

export function useWebPush() {
  useEffect(() => {
    async function setupPush() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;
          
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
          }
          
          const userId = localStorage.getItem('user_id');
          const userName = localStorage.getItem('user_name');
          if (userId || userName) {
            await fetch(`${API_URL}/api/users/push/subscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, userName, subscription })
            });
          }
        } catch (error) {
          console.error('Service Worker / Push error:', error);
        }
      }
    }
    
    if (localStorage.getItem('user_id')) {
      setupPush();
    }
  }, []);
}
