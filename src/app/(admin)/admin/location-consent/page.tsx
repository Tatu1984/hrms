'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ConsentRow {
  userId: string;
  name: string;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  role: string;
  status: 'GRANTED' | 'DENIED' | 'PENDING' | 'NONE';
  respondedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  capturedAt: string | null;
}

interface Data {
  summary: { total: number; granted: number; denied: number; pending: number };
  rows: ConsentRow[];
}

function StatusBadge({ status }: { status: ConsentRow['status'] }) {
  if (status === 'GRANTED') return <Badge className="bg-green-100 text-green-800">Granted</Badge>;
  if (status === 'DENIED') return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
  return <Badge className="bg-gray-100 text-gray-700">Not responded</Badge>;
}

function fmt(ts: string | null) {
  return ts ? new Date(ts).toLocaleString() : '—';
}

export default function LocationConsentPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/location-consent');
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          Location Sharing Consent
        </h1>
        <p className="text-sm text-gray-500">
          Who has allowed precise (GPS) location sharing. Users who haven&apos;t granted it are
          re-prompted on every login.
        </p>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total users</p><p className="text-2xl font-bold">{data.summary.total}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Granted</p><p className="text-2xl font-bold text-green-600">{data.summary.granted}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Denied</p><p className="text-2xl font-bold text-red-600">{data.summary.denied}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Not responded</p><p className="text-2xl font-bold text-gray-600">{data.summary.pending}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consent by user</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : !data || data.rows.length === 0 ? (
            <p className="text-sm text-gray-500">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Responded</th>
                    <th className="py-2 pr-4">Precise location</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.userId} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">
                          {[r.employeeId, r.department].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-gray-600">{r.role}</td>
                      <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-2 pr-4 text-gray-600">{fmt(r.respondedAt)}</td>
                      <td className="py-2 pr-4">
                        {r.latitude != null && r.longitude != null ? (
                          <div>
                            <a
                              className="text-blue-600 underline"
                              href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View on map
                            </a>
                            <div className="text-xs text-gray-500">
                              ±{r.accuracyM != null ? Math.round(r.accuracyM) : '?'} m · {fmt(r.capturedAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
