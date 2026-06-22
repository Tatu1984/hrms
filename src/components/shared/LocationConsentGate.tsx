'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, ShieldCheck } from 'lucide-react';

type Status = 'GRANTED' | 'DENIED' | 'PENDING' | 'NONE';

async function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });
}

async function post(body: Record<string, unknown>) {
  return fetch('/api/location-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Shown to every signed-in user. If they haven't granted precise-location
 * sharing, a consent modal appears (on every login until they Allow). If they
 * already granted, we silently refresh the fix in the background — the browser
 * permission is already held, so there's no popup.
 */
export default function LocationConsentGate() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/location-consent');
        if (!res.ok) return;
        const { status } = (await res.json()) as { status: Status };
        if (cancelled) return;

        if (status === 'GRANTED') {
          // Already consented — refresh the location quietly (no UI, no popup).
          try {
            const pos = await getPosition();
            await post({
              status: 'GRANTED',
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          } catch {
            /* permission may have been revoked in the browser; ignore */
          }
        } else {
          // NONE / DENIED / PENDING → ask again.
          setOpen(true);
        }
      } catch {
        /* network/endpoint issue — don't block the app */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allow = async () => {
    setBusy(true);
    setError(null);
    try {
      const pos = await getPosition();
      await post({
        status: 'GRANTED',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setOpen(false);
    } catch {
      // The browser blocked or the user dismissed the native prompt. Record a
      // denial (so it's visible to admins) and tell them how to enable it.
      await post({ status: 'DENIED' }).catch(() => {});
      setError(
        'Location was blocked by your browser. Please allow location access for this site (check the address-bar icon), then try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const notNow = async () => {
    setBusy(true);
    try {
      await post({ status: 'DENIED' }).catch(() => {});
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && notNow()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Share your precise location
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-3 text-sm">
            <span className="block">
              To verify where you sign in from, this workspace asks for your{' '}
              <strong>precise device location</strong>. This is more accurate than the approximate
              city we currently detect from your network.
            </span>
            <span className="block rounded-md bg-blue-50 border border-blue-200 p-3 text-blue-900">
              <ShieldCheck className="inline w-4 h-4 mr-1 -mt-0.5" />
              Your location is shared only with your employer&apos;s admins, used for login/attendance
              verification, and only while you consent. You can decline.
            </span>
            {error && (
              <span className="block rounded-md bg-red-50 border border-red-200 p-3 text-red-700">
                {error}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={notNow} disabled={busy}>
            Not now
          </Button>
          <Button onClick={allow} disabled={busy}>
            {busy ? 'Requesting…' : 'Allow precise location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
