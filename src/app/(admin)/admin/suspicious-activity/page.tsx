'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SuspiciousSummary {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    department: string;
  };
  date: string;
  count: number;
  timestamps: string[];
}

interface SuspiciousActivityData {
  totalSuspicious: number;
  summary: SuspiciousSummary[];
  logs: any[];
}

export default function SuspiciousActivityPage() {
  const [data, setData] = useState<SuspiciousActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<string>('30'); // days

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchSuspiciousActivity();
  }, [selectedEmployee, dateRange]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSuspiciousActivity = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedEmployee !== 'all') {
        params.append('employeeId', selectedEmployee);
      }

      const response = await fetch(`/api/admin/suspicious-activity?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (count: number) => {
    if (count > 50) return 'bg-red-100 text-red-800 border-red-300';
    if (count > 20) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (count > 10) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getSeverityBadge = (count: number) => {
    if (count > 50) return <Badge variant="destructive">Critical</Badge>;
    if (count > 20) return <Badge className="bg-orange-500">High</Badge>;
    if (count > 10) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            Suspicious Activity Monitor
          </h1>
          <p className="text-gray-500 mt-1">
            Detects automated bot patterns (auto-clickers, mouse jigglers, keystroke simulators)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-sm text-gray-600 mb-1 block">Time Period</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6">
              <Button onClick={fetchSuspiciousActivity}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Suspicious Events</p>
                  <p className="text-2xl font-bold">{data.totalSuspicious}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employees Flagged</p>
                  <p className="text-2xl font-bold">
                    {new Set(data.summary.map(s => s.employee.id)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Days with Activity</p>
                  <p className="text-2xl font-bold">
                    {new Set(data.summary.map(s => s.date)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suspicious Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Bot Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading suspicious activity...</p>
            </div>
          ) : data && data.summary.length > 0 ? (
            <div className="space-y-3">
              {data.summary.map((item, index) => (
                <div
                  key={`${item.employee.id}_${item.date}`}
                  className={`p-4 rounded-lg border ${getSeverityColor(item.count)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.employee.name}</h3>
                        {getSeverityBadge(item.count)}
                        <Badge variant="outline" className="text-xs">
                          {item.employee.employeeId}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <span className="font-medium">Department:</span> {item.employee.department}
                        </p>
                        <p>
                          <span className="font-medium">Date:</span>{' '}
                          {format(new Date(item.date), 'MMMM d, yyyy')}
                        </p>
                        <p>
                          <span className="font-medium">Pattern Type:</span>{' '}
                          Automated activity detected (keystroke/mouse patterns)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-600">{item.count}</div>
                      <div className="text-xs text-gray-600">suspicious events</div>
                    </div>
                  </div>

                  {/* Time Distribution */}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Time Distribution:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.timestamps.slice(0, 10).map((ts, i) => (
                        <span
                          key={i}
                          className="text-xs bg-white px-2 py-1 rounded font-mono"
                        >
                          {format(new Date(ts), 'HH:mm:ss')}
                        </span>
                      ))}
                      {item.timestamps.length > 10 && (
                        <span className="text-xs text-gray-600 px-2 py-1">
                          +{item.timestamps.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">No Suspicious Activity Detected</p>
              <p className="text-sm">All employees showing normal activity patterns</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What Gets Detected?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Repetitive keystroke patterns (same key pressed 10+ times)</li>
            <li>• Regular interval keystrokes (exact timing every 5-10 seconds)</li>
            <li>• Alternating key patterns (two keys pressed repeatedly)</li>
            <li>• Linear mouse movements (mouse jiggler apps)</li>
            <li>• Automated bot activity patterns</li>
          </ul>
          <p className="text-xs text-blue-700 mt-3">
            Note: Detection is completely silent - employees are not notified when patterns are detected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
