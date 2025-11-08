'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email, password: '***' });

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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

      const redirectMap = {
        ADMIN: '/admin/dashboard',
        MANAGER: '/manager/dashboard',
        EMPLOYEE: '/employee/dashboard',
      };

      const redirectUrl = redirectMap[data.role as keyof typeof redirectMap];
      console.log('Redirecting to:', redirectUrl);

      router.push(redirectUrl);
      router.refresh();
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
                <p>👤 Username: <strong>admin</strong> / Password: <strong>12345678</strong></p>
                <p>👤 Username: <strong>manager</strong> / Password: <strong>12345678</strong></p>
                <p>👤 Username: <strong>employee</strong> / Password: <strong>12345678</strong></p>
                <p className="text-xs mt-2 text-gray-400">You can also login with email</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}