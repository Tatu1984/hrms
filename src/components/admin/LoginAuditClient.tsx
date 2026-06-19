'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthEvent {
  id: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'SESSION_EXPIRED' | 'SESSION_REVOKED';
  userName: string | null;
  emailTried: string | null;
  failureReason: string | null;
  ipAddress: string | null;
  city: string | null;
  district: string | null;
  region: string | null;
  postal: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  isp: string | null;
  asn: string | null;
  isVpnOrProxy: boolean | null;
  browserName: string | null;
  osName: string | null;
  deviceType: string | null;
  clientTimezone: string | null;
  riskScore: number | null;
  anomalies: { code: string; severity: 'low' | 'medium' | 'high'; detail: string }[] | null;
  createdAt: string;
}

interface ActiveSession {
  sessionId: string;
  userName: string;
  userRole: string;
  ipAddress: string | null;
  city: string | null;
  district: string | null;
  region: string | null;
  postal: string | null;
  country: string | null;
  isp: string | null;
  asn: string | null;
  isVpnOrProxy: boolean | null;
  latitude: number | null;
  longitude: number | null;
  lastSeenAt: string;
  createdAt: string;
}

function locationText(e: {
  district?: string | null;
  city?: string | null;
  region?: string | null;
  postal?: string | null;
  country?: string | null;
}) {
  const place = [e.district, e.city, e.region, e.country].filter(Boolean).join(', ') || 'Unknown';
  return e.postal ? `${place} · ${e.postal}` : place;
}

function mapsLink(lat: number | null, lon: number | null) {
  if (lat == null || lon == null) return null;
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

function RiskBadge({ score }: { score: number | null }) {
  if (score == null || score === 0) return <Badge className="bg-green-100 text-green-800">Clean</Badge>;
  if (score >= 60) return <Badge className="bg-red-100 text-red-800">High · {score}</Badge>;
  if (score >= 30) return <Badge className="bg-orange-100 text-orange-800">Medium · {score}</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Low · {score}</Badge>;
}

function EventTypeBadge({ type }: { type: AuthEvent['eventType'] }) {
  const map: Record<AuthEvent['eventType'], string> = {
    LOGIN_SUCCESS: 'bg-green-50 text-green-700 border border-green-200',
    LOGIN_FAILED: 'bg-red-50 text-red-700 border border-red-200',
    LOGOUT: 'bg-gray-100 text-gray-700',
    SESSION_EXPIRED: 'bg-gray-100 text-gray-600',
    SESSION_REVOKED: 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[type]}`}>{type.replace('_', ' ')}</span>;
}

function fmt(ts: string) {
  return new Date(ts).toLocaleString();
}

export default function LoginAuditClient({ canRevoke }: { canRevoke: boolean }) {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [auditRes, sessRes] = await Promise.all([
          fetch('/api/auth/audit?limit=200'),
          fetch('/api/auth/sessions'),
        ]);
        if (auditRes.ok) {
          const a = await auditRes.json();
          setEvents(a.events || []);
          setFlaggedCount(a.flaggedCount || 0);
        }
        if (sessRes.ok) {
          const s = await sessRes.json();
          setSessions(s.sessions || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const flagged = useMemo(() => events.filter((e) => (e.riskScore ?? 0) > 0), [events]);

  const revoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const res = await fetch(`/api/auth/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      }
    } finally {
      setRevoking(null);
    }
  };

  const EventRow = ({ e }: { e: AuthEvent }) => {
    const link = mapsLink(e.latitude, e.longitude);
    return (
      <div className="border-b last:border-0 py-3 px-2 hover:bg-gray-50">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-[180px]">
            <div className="font-medium">{e.userName || e.emailTried || 'Unknown user'}</div>
            <div className="text-xs text-gray-500">{fmt(e.createdAt)}</div>
            <div className="mt-1"><EventTypeBadge type={e.eventType} /></div>
            {e.failureReason && (
              <div className="text-xs text-red-600 mt-1">Reason: {e.failureReason}</div>
            )}
          </div>

          <div className="text-sm min-w-[200px]">
            <div className="font-medium">{locationText(e)}</div>
            <div className="text-xs text-gray-500">IP {e.ipAddress || 'unknown'}</div>
            <div className="text-xs text-gray-500">{e.isp || e.asn || '—'}</div>
            {link && (
              <a className="text-xs text-blue-600 underline" href={link} target="_blank" rel="noreferrer">
                View on map
              </a>
            )}
          </div>

          <div className="text-xs text-gray-600 min-w-[160px]">
            <div>{[e.browserName, e.osName].filter(Boolean).join(' · ') || 'Unknown device'}</div>
            <div>{e.deviceType}</div>
            {e.clientTimezone && <div>TZ: {e.clientTimezone}</div>}
            {e.isVpnOrProxy && <Badge className="bg-red-100 text-red-800 mt-1">VPN / Proxy</Badge>}
          </div>

          <div className="min-w-[110px]">
            <RiskBadge score={e.riskScore} />
          </div>
        </div>

        {e.anomalies && e.anomalies.length > 0 && (
          <ul className="mt-2 ml-2 space-y-1">
            {e.anomalies.map((a, i) => (
              <li key={i} className="text-xs flex items-start gap-2">
                <span
                  className={
                    a.severity === 'high'
                      ? 'text-red-600'
                      : a.severity === 'medium'
                        ? 'text-orange-600'
                        : 'text-yellow-700'
                  }
                >
                  ●
                </span>
                <span>
                  <strong>{a.code}</strong> — {a.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Login Audit</h1>
          <p className="text-sm text-gray-500">
            Geo-aware login/logout history with behavioral anomaly detection.
          </p>
        </div>
        <a href="/api/auth/audit?format=csv&limit=5000" download>
          <Button variant="outline" size="sm">Export CSV</Button>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Events shown</p>
            <p className="text-2xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Flagged events</p>
            <p className="text-2xl font-bold text-orange-600">{flaggedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active sessions</p>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading login activity…</p>
      ) : (
        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="anomalies">Anomalies ({flagged.length})</TabsTrigger>
            <TabsTrigger value="activity">All Activity</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions ({sessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="anomalies">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Flagged logins</CardTitle>
              </CardHeader>
              <CardContent>
                {flagged.length === 0 ? (
                  <p className="text-sm text-gray-500">No anomalies in the current window.</p>
                ) : (
                  flagged.map((e) => <EventRow key={e.id} e={e} />)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Login / logout history</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-gray-500">No events yet.</p>
                ) : (
                  events.map((e) => <EventRow key={e.id} e={e} />)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Currently active sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No active sessions.</p>
                ) : (
                  sessions.map((s) => {
                    const link = mapsLink(s.latitude, s.longitude);
                    return (
                      <div
                        key={s.sessionId}
                        className="border-b last:border-0 py-3 px-2 flex items-start justify-between gap-4 flex-wrap"
                      >
                        <div className="min-w-[160px]">
                          <div className="font-medium">{s.userName}</div>
                          <div className="text-xs text-gray-500">{s.userRole}</div>
                          <div className="text-xs text-gray-500">Last seen {fmt(s.lastSeenAt)}</div>
                        </div>
                        <div className="text-sm min-w-[200px]">
                          <div className="font-medium">{locationText(s)}</div>
                          <div className="text-xs text-gray-500">IP {s.ipAddress || 'unknown'}</div>
                          <div className="text-xs text-gray-500">{s.isp || s.asn || '—'}</div>
                          {s.isVpnOrProxy && (
                            <Badge className="bg-red-100 text-red-800 mt-1">VPN / Proxy</Badge>
                          )}
                          {link && (
                            <a
                              className="text-xs text-blue-600 underline block"
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View on map
                            </a>
                          )}
                        </div>
                        {canRevoke && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={revoking === s.sessionId}
                            onClick={() => revoke(s.sessionId)}
                          >
                            {revoking === s.sessionId ? 'Revoking…' : 'Revoke'}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
