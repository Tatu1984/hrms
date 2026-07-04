'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  // Check if user is already authenticated to prevent redirect loops
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.role) {
            const redirectMap: Record<string, string> = {
              ADMIN: '/admin/dashboard',
              MANAGER: '/manager/dashboard',
              EMPLOYEE: '/employee/dashboard',
            };
            window.location.href = redirectMap[data.role] || '/login';
          }
        }
      } catch {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email, password: '***' });

      // Client-side signals used by the login audit / anomaly detection
      // (browser timezone vs IP timezone, device fingerprinting).
      const clientMeta = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        platform: (navigator as any).userAgentData?.platform || navigator.platform,
      };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, clientMeta }),
      });

      console.log('Response status:', res.status);
      console.log('Response OK:', res.ok);

      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok) {
        const errorMsg = data.error || 'Login failed';
        const detailMsg = data.details ? ` (${data.details})` : '';
        throw new Error(errorMsg + detailMsg);
      }

      // Show success message
      setSuccess(`Welcome back, ${data.name}!`);

      // First-login (or admin-forced) password change: divert to the change
      // form before landing on the dashboard.
      if (data.mustChangePassword) {
        setTimeout(() => {
          router.push('/change-password');
          router.refresh();
        }, 800);
        return;
      }

      // Initialize heartbeat tracking based on existing attendance
      if (data.role === 'EMPLOYEE' && data.employeeId) {
        // Check if user is already punched in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkAttendance = await fetch(`/api/attendance?date=${today.toISOString()}`);
        if (checkAttendance.ok) {
          const attendanceData = await checkAttendance.json();

          // If user is punched in (has punchIn but no punchOut), initialize heartbeat cookies
          if (attendanceData && attendanceData.punchIn && !attendanceData.punchOut) {
            localStorage.setItem('hrms_punched_in', 'true');
            localStorage.setItem('hrms_last_activity', Date.now().toString());
            document.cookie = `hrms_punched_in=true; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `hrms_attendance_id=${attendanceData.id}; path=/; max-age=86400; SameSite=Lax`;
            console.log('[Login] User already punched in - heartbeat tracking initialized');
          } else {
            // User not punched in, clear any stale cookies
            localStorage.setItem('hrms_punched_in', 'false');
            localStorage.removeItem('hrms_last_activity');
            localStorage.removeItem('hrms_last_heartbeat');
            document.cookie = 'hrms_punched_in=false; path=/; max-age=0';
            document.cookie = 'hrms_attendance_id=; path=/; max-age=0';
            console.log('[Login] User not punched in - cleared heartbeat tracking');
          }
        }
      }

      const redirectMap = {
        ADMIN: '/admin/dashboard',
        MANAGER: '/manager/dashboard',
        EMPLOYEE: '/employee/dashboard',
      };

      const redirectUrl = redirectMap[data.role as keyof typeof redirectMap];
      console.log('Redirecting to:', redirectUrl);

      // Redirect after showing success message
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 800);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">HRMS</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email or Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="admin or admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              You can log in with your username or email. Forgot your password?
              Contact your administrator to have it reset.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}