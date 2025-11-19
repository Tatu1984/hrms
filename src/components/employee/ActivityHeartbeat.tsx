'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Activity Heartbeat Component
 * Tracks employee activity and sends heartbeats every 3 minutes
 * Detects keyboard/mouse activity to determine if employee is active
 */
export function ActivityHeartbeat() {
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('[ActivityHeartbeat] Component mounted');

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
      const wasActive = timeSinceLastActivity < 5 * 60 * 1000;

      console.log('[Heartbeat] Sending... Active:', wasActive, 'LastActivity:', Math.floor(timeSinceLastActivity / 1000) + 's ago');

      try {
        const response = await fetch('/api/attendance/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: wasActive }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[Heartbeat] Failed:', error);
          setDebugInfo('Failed: ' + JSON.stringify(error));
        } else {
          const data = await response.json();
          console.log('[Heartbeat] Success:', data);
          setDebugInfo('Success at ' + new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('[Heartbeat] Error:', error);
        setDebugInfo('Error: ' + String(error));
      }
    };

    // Send initial heartbeat immediately
    console.log('[ActivityHeartbeat] Sending initial heartbeat');
    sendHeartbeat();

    // Set up interval to send heartbeat every 3 minutes (180000ms)
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 3 * 60 * 1000);
    console.log('[ActivityHeartbeat] Interval set up for every 3 minutes');

    return () => {
      console.log('[ActivityHeartbeat] Component unmounting, cleaning up');
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('mousemove', trackActivity);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  // Show debug info in development
  if (process.env.NODE_ENV === 'development' && debugInfo) {
    return (
      <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded opacity-50 z-50">
        Heartbeat: {debugInfo}
      </div>
    );
  }

  return null;
}
