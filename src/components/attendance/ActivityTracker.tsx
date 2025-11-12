'use client';

import { useEffect, useRef } from 'react';

interface ActivityTrackerProps {
  isActive: boolean; // Only track when user is punched in
  onActivityDetected?: () => void;
}

/**
 * ActivityTracker - Monitors user activity (mouse, keyboard, scroll)
 * and sends periodic heartbeats to the server to track active work time.
 *
 * Detection Logic:
 * - Tracks mouse movements, clicks, keyboard inputs, and scrolling
 * - Sends heartbeat every 30 seconds if activity detected
 * - If no activity for 5 minutes, user is considered idle
 * - Resumes tracking when activity is detected again
 */
export function ActivityTracker({ isActive, onActivityDetected }: ActivityTrackerProps) {
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRecentActivityRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isActive) {
      // Clean up if not active
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
      }
      return;
    }

    // Activity event handler
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      hasRecentActivityRef.current = true;
      onActivityDetected?.();
    };

    // Set up event listeners for various activity types
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Send heartbeat every 30 seconds if there was activity
    heartbeatIntervalRef.current = setInterval(async () => {
      if (hasRecentActivityRef.current) {
        try {
          await fetch('/api/attendance/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              active: true,
            }),
          });
          hasRecentActivityRef.current = false; // Reset flag after sending
        } catch (error) {
          console.error('Failed to send activity heartbeat:', error);
        }
      }
    }, 30000); // Every 30 seconds

    // Check for idle state every minute
    idleCheckIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const idleThresholdMs = 5 * 60 * 1000; // 5 minutes

      if (timeSinceLastActivity > idleThresholdMs && hasRecentActivityRef.current) {
        // User has been idle for more than threshold
        hasRecentActivityRef.current = false;
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
      }
    };
  }, [isActive, onActivityDetected]);

  // This component doesn't render anything visible
  return null;
}
