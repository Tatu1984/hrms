'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Sparkles, ExternalLink } from 'lucide-react';

interface BillingStatus {
  configured: boolean;
  plan: string;
  planName: string;
  seatLimit: number | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
}

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/status');
      if (response.ok) {
        setStatus(await response.json());
      }
    } catch (error) {
      console.error('Error fetching billing status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async () => {
    setBusy('checkout');
    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Failed to start checkout');
    } finally {
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy('portal');
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Failed to open billing portal');
    } finally {
      setBusy(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const isPro = status?.plan === 'pro';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-7 h-7" />
          Billing
        </h1>
        <p className="text-gray-600">Manage your subscription and plan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading billing details...</div>
          ) : !status ? (
            <div className="py-8 text-center text-gray-500">Unable to load billing details.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{status.planName} Plan</h3>
                    <span
                      className={
                        isPro
                          ? 'px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700'
                          : 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700'
                      }
                    >
                      {status.subscriptionStatus ?? (isPro ? 'active' : 'free')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {status.seatLimit === null
                      ? 'Unlimited seats'
                      : `Up to ${status.seatLimit} seats`}
                  </p>
                  {status.currentPeriodEnd && (
                    <p className="text-sm text-gray-500 mt-1">
                      Renews / ends on {formatDate(status.currentPeriodEnd)}
                    </p>
                  )}
                </div>
              </div>

              {status.configured ? (
                <div className="flex flex-wrap gap-3">
                  {!isPro && (
                    <Button onClick={startCheckout} disabled={busy !== null}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {busy === 'checkout' ? 'Redirecting...' : 'Upgrade to Pro'}
                    </Button>
                  )}
                  <Button variant="outline" onClick={openPortal} disabled={busy !== null}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {busy === 'portal' ? 'Redirecting...' : 'Manage billing'}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Billing is not enabled on this deployment.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
