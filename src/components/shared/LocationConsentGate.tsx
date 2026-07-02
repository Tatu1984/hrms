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

function getOnce(opts: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

function isPermissionDenied(e: unknown): boolean {
  const err = e as GeolocationPositionError | undefined;
  // 1 === GeolocationPositionError.PERMISSION_DENIED
  return !!err && typeof err.code === 'number' && err.code === 1;
}

/**
 * Read the current geolocation permission WITHOUT triggering the browser prompt.
 * Returns 'unsupported' where the Permissions API isn't available.
 */
async function queryGeoPermission(): Promise<PermissionState | 'unsupported'> {
  try {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) return 'unsupported';
    const s = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return s.state;
  } catch {
    return 'unsupported';
  }
}

// Run the consent flow at most once per browser session, so a page refresh never
// re-prompts. Cleared when the tab/session ends (i.e. on the next fresh login).
const SESSION_FLAG = 'hrms:geo:handled';
function alreadyHandled(): boolean {
  try {
    return sessionStorage.getItem(SESSION_FLAG) === '1';
  } catch {
    return false;
  }
}
function markHandled() {
  try {
    sessionStorage.setItem(SESSION_FLAG, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Get a position, preferring a precise GPS fix. Desktops without a GPS chip
 * frequently time out on high-accuracy reads, so on a non-permission failure we
 * retry with a coarse network fix (and allow a recent cached one) rather than
 * failing outright — otherwise consent could never be recorded on those devices.
 * `allowCache` lets the silent background refresh reuse a recent fix instead of
 * actively polling GPS on every page load.
 */
async function getPosition(allowCache = false): Promise<GeolocationPosition> {
  try {
    return await getOnce({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: allowCache ? 6 * 60 * 60 * 1000 : 0,
    });
  } catch (e) {
    if (isPermissionDenied(e)) throw e; // user blocked — don't retry
    return await getOnce({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: allowCache ? 6 * 60 * 60 * 1000 : 5 * 60 * 1000,
    });
  }
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
      // Only act once per browser session — never on every refresh.
      if (alreadyHandled()) return;
      try {
        const res = await fetch('/api/location-consent');
        if (!res.ok) return;
        const { status } = (await res.json()) as { status: Status };
        if (cancelled) return;

        if (status === 'GRANTED') {
          markHandled();
          // Only read the location if the browser permission is ALREADY granted —
          // that path never shows a prompt. If it's 'prompt'/'denied'/unsupported,
          // do nothing here (no nag); we keep the last known fix from grant time.
          const perm = await queryGeoPermission();
          if (perm === 'granted') {
            try {
              const pos = await getPosition(true);
              await post({
                status: 'GRANTED',
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              });
            } catch {
              /* transient; keep stored status */
            }
          }
        } else {
          // Not yet granted — ask once this session (the native prompt only fires
          // when the user clicks "Allow").
          markHandled();
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
    } catch (e) {
      if (isPermissionDenied(e)) {
        // User actually blocked location in the browser. Record the denial and
        // tell them how to enable it.
        await post({ status: 'DENIED' }).catch(() => {});
        setError(
          'Location was blocked by your browser. Please allow location access for this site (check the address-bar icon), then try again.',
        );
      } else {
        // Permission was granted but we couldn't get a fix right now (e.g. GPS
        // timeout on a desktop). Record consent as GRANTED so we don't nag on
        // every login — coordinates will be captured on a later successful read.
        await post({ status: 'GRANTED' }).catch(() => {});
        setOpen(false);
      }
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
