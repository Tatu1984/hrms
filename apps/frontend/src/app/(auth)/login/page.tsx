'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch('/api/auth/me');
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
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        json: { email, password },
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Login failed';
        const detailMsg = data.details ? ` (${data.details})` : '';
        throw new Error(errorMsg + detailMsg);
      }

      setSuccess(`Welcome back, ${data.name}!`);

      // Initialize heartbeat tracking based on existing attendance
      if (data.role === 'EMPLOYEE' && data.employeeId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkAttendance = await apiFetch(`/api/attendance?date=${today.toISOString()}`);
        if (checkAttendance.ok) {
          const attendanceData = await checkAttendance.json();

          if (attendanceData && attendanceData.punchIn && !attendanceData.punchOut) {
            localStorage.setItem('hrms_punched_in', 'true');
            localStorage.setItem('hrms_last_activity', Date.now().toString());
            document.cookie = `hrms_punched_in=true; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `hrms_attendance_id=${attendanceData.id}; path=/; max-age=86400; SameSite=Lax`;
          } else {
            localStorage.setItem('hrms_punched_in', 'false');
            localStorage.removeItem('hrms_last_activity');
            localStorage.removeItem('hrms_last_heartbeat');
            document.cookie = 'hrms_punched_in=false; path=/; max-age=0';
            document.cookie = 'hrms_attendance_id=; path=/; max-age=0';
          }
        }
      }

      const redirectMap = {
        ADMIN: '/admin/dashboard',
        MANAGER: '/manager/dashboard',
        EMPLOYEE: '/employee/dashboard',
      };

      const redirectUrl = redirectMap[data.role as keyof typeof redirectMap];

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

            <div className="text-sm text-gray-500 text-center mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold mb-2">Demo Accounts:</p>
              <div className="space-y-1">
                <p>Username: <strong>admin</strong> / Password: <strong>12345678</strong></p>
                <p>Username: <strong>manager</strong> / Password: <strong>12345678</strong></p>
                <p>Username: <strong>employee</strong> / Password: <strong>12345678</strong></p>
                <p className="text-xs mt-2 text-gray-400">You can also login with email</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
