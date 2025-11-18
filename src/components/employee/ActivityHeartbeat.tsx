'use client';

import { useEffect, useRef } from 'react';

/**
 * Activity Heartbeat Component
 * Tracks employee activity and sends heartbeats every 3 minutes
 * Detects keyboard/mouse activity to determine if employee is active
 */
export function ActivityHeartbeat() {
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Track user activity
    const trackActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Listen for keyboard and mouse activity
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('mousemove', trackActivity);
    window.addEventListener('click', trackActivity);
    window.addEventListener('scroll', trackActivity);

    // Send heartbeat every 3 minutes
    const sendHeartbeat = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Only send heartbeat if there was activity in last 5 minutes
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        try {
          await fetch('/api/attendance/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
        }
      }
    };

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Set up interval to send heartbeat every 3 minutes
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 3 * 60 * 1000);

    return () => {
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
