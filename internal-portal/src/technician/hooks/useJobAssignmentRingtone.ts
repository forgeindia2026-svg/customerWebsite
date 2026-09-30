import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const API_URL = import.meta.env.VITE_API_URL || 'https://43.204.218.193.sslip.io';

export function useJobAssignmentRingtone() {
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    // Connect to global socket
    const socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      socket.emit('join_user', userId);
      socket.emit('join_role', 'technician');
    });

    let ringAudio: HTMLAudioElement | null = null;
    let ringTimeout: any = null;

    socket.on('job:assigned_to_you', (data) => {
      // Show native browser notification immediately
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Job Assigned!', {
          body: `You have been assigned to: ${data.jobCode}`,
          icon: '/sk-logo.png',
          requireInteraction: true,
          vibrate: [500, 250, 500, 250, 500, 250, 500]
        });
      }

      // Play 30-second ringing sound
      if (ringAudio) {
        ringAudio.pause();
        clearTimeout(ringTimeout);
      }

      // Create synthetic audio context for a repeating alarm tone
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      };

      // Ring every 1.5 seconds for 30 seconds
      let ticks = 0;
      const ringInterval = setInterval(() => {
        playBeep();
        ticks++;
        if (ticks >= 20) { // 20 * 1.5s = 30 seconds
          clearInterval(ringInterval);
        }
      }, 1500);
      playBeep();

      ringTimeout = setTimeout(() => {
        clearInterval(ringInterval);
      }, 30000);
    });

    return () => {
      socket.disconnect();
      if (ringTimeout) clearTimeout(ringTimeout);
    };
  }, []);
}
