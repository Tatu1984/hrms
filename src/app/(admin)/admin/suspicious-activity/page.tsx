'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Shield, Users, Calendar, Eye, X } from 'lucide-react';
import { format } from 'date-fns';

interface PatternInfo {
  type: string;
  details: string;
  timestamp: string;
  confidence: string | null;
  confidenceScore: number | null;
  durationMs: number | null;
}

interface DeviceFingerprint {
  ipAddress: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: string | null;
  screenResolution: string | null;
  timezone: string | null;
}

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
  patterns: PatternInfo[];
  fingerprint: DeviceFingerprint | null;
  uniqueIps: string[];
  totalDurationMs: number;
  highestConfidence: string | null;
  highestConfidenceScore: number;
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
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    summary: SuspiciousSummary | null;
  }>({ open: false, summary: null });

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

  const getPatternTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      REPETITIVE_KEY: 'Repetitive Keystroke',
      REGULAR_INTERVAL_KEYSTROKES: 'Auto-Typer',
      ALTERNATING_KEYS: 'Keyboard Macro',
      LINEAR_MOUSE_MOVEMENT: 'Mouse Jiggler',
      STATIC_MOUSE: 'Fake Mouse App',
      OSCILLATING_MOUSE: 'Mouse Jiggler (Oscillating)',
      MOUSE_JIGGLER: 'Mouse Jiggler',
      LINEAR_JIGGLER: 'Linear Jiggler',
      AUTO_CLICKER: 'Auto-Clicker',
      AUTO_TYPER: 'Auto-Typer',
      ALTERNATING_MACRO: 'Alternating Key Macro',
      STATIC_MOUSE_PATTERN: 'Static Mouse (No Movement)',
    };
    return labels[type] || type;
  };

  // Detailed explanations for each pattern type
  const getPatternExplanation = (type: string): { title: string; description: string; concern: string; recommendation: string } => {
    const explanations: Record<string, { title: string; description: string; concern: string; recommendation: string }> = {
      REPETITIVE_KEY: {
        title: 'Repetitive Keystroke Detected',
        description: 'The same key was pressed many times in rapid succession with unnaturally consistent timing.',
        concern: 'This pattern often indicates use of keyboard macro software or physical key-holding devices designed to simulate activity.',
        recommendation: 'Review the employee\'s actual work output during this period to determine if they were genuinely productive.',
      },
      REGULAR_INTERVAL_KEYSTROKES: {
        title: 'Auto-Typer Software Detected',
        description: 'Keystrokes occurred at mathematically exact intervals (e.g., every 3.000 seconds), which is humanly impossible.',
        concern: 'This is a strong indicator of automated typing software designed to simulate work activity without actual productivity.',
        recommendation: 'Check if the employee completed any measurable work tasks. This is high-confidence automation detection.',
      },
      ALTERNATING_KEYS: {
        title: 'Keyboard Macro Pattern',
        description: 'Two keys were pressed in perfect alternation (A-B-A-B pattern) with identical timing between each press.',
        concern: 'This pattern suggests a programmed keyboard macro rather than genuine typing activity.',
        recommendation: 'Verify if there was any legitimate work that required such repetitive input patterns.',
      },
      LINEAR_MOUSE_MOVEMENT: {
        title: 'Linear Mouse Movement Detected',
        description: 'The mouse moved in perfectly straight lines with exact distances and timing between movements.',
        concern: 'Human mouse movements are naturally curved and varied. Perfect linear patterns indicate automation.',
        recommendation: 'This is often caused by mouse jiggler software. Review the employee\'s screen activity if possible.',
      },
      MOUSE_JIGGLER: {
        title: 'Mouse Jiggler Pattern',
        description: 'The mouse showed an oscillating back-and-forth movement pattern with consistent timing and distance.',
        concern: 'Mouse jigglers are specifically designed to prevent the screen from locking, keeping the user "active" without actual work.',
        recommendation: 'This is a classic automation pattern. Discuss with the employee about their activity during this time.',
      },
      LINEAR_JIGGLER: {
        title: 'Linear Mouse Jiggler',
        description: 'The mouse moved in one direction with exact, repeated movements and perfect timing intervals.',
        concern: 'Unlike natural mouse use, this shows mechanical precision indicative of automation software.',
        recommendation: 'High probability of automated activity. Cross-reference with work output and deliverables.',
      },
      STATIC_MOUSE: {
        title: 'Fake Mouse Activity',
        description: 'Mouse move events were detected but the cursor position did not actually change.',
        concern: 'This indicates software that generates fake mouse events without real cursor movement - a sophisticated evasion technique.',
        recommendation: 'This is highly suspicious. The employee may be using advanced activity simulation software.',
      },
      STATIC_MOUSE_PATTERN: {
        title: 'No Real Mouse Movement',
        description: 'Mouse activity was reported but the actual cursor stayed in the same position or moved minimally.',
        concern: 'Legitimate work involves cursor movement. Static mouse with activity events is abnormal.',
        recommendation: 'Verify if the employee was actually present at their workstation.',
      },
      OSCILLATING_MOUSE: {
        title: 'Oscillating Mouse Pattern',
        description: 'The mouse moved back and forth in a repetitive oscillating pattern.',
        concern: 'This is a signature pattern of mouse jiggler devices or software.',
        recommendation: 'Review attendance records and actual work completed during the flagged period.',
      },
      AUTO_CLICKER: {
        title: 'Auto-Clicker Detected',
        description: 'Mouse clicks occurred at perfectly regular intervals (e.g., exactly every 2.000 seconds).',
        concern: 'Human clicking has natural variation. Exact intervals indicate automated clicking software.',
        recommendation: 'Check if there was any task that legitimately required such repetitive clicking.',
      },
      AUTO_TYPER: {
        title: 'Automated Typing Detected',
        description: 'Keys were pressed at exact intervals with no natural variation in typing speed.',
        concern: 'Real typing has variable speeds. Constant-interval typing is automated.',
        recommendation: 'Verify if any documents or messages were actually created during this activity.',
      },
      ALTERNATING_MACRO: {
        title: 'Key Alternation Macro',
        description: 'Two specific keys alternated in perfect sequence with identical timing.',
        concern: 'This mechanical pattern is impossible with natural typing behavior.',
        recommendation: 'Often used in gaming but suspicious in work context. Discuss with the employee.',
      },
    };

    return explanations[type] || {
      title: 'Unusual Activity Pattern',
      description: 'An activity pattern was detected that differs significantly from normal human behavior.',
      concern: 'The detected pattern may indicate automated activity simulation.',
      recommendation: 'Review the employee\'s work output and discuss the activity with them.',
    };
  };

  const getPatternIcon = (type: string) => {
    if (type.includes('KEY') || type.includes('KEYSTROKE')) return '⌨️';
    if (type.includes('MOUSE')) return '🖱️';
    return '⚠️';
  };

  const getConfidenceBadge = (confidence: string | null, score: number | null) => {
    if (!confidence) return null;
    const colors: Record<string, string> = {
      HIGH: 'bg-red-600 text-white',
      MEDIUM: 'bg-orange-500 text-white',
      LOW: 'bg-yellow-500 text-black',
    };
    return (
      <Badge className={colors[confidence] || 'bg-gray-500'}>
        {confidence} {score ? `(${score}%)` : ''}
      </Badge>
    );
  };

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms || ms === 0) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === 'mobile') return '📱';
    if (deviceType === 'tablet') return '📱';
    return '💻';
  };

  const openDetailsDialog = (summary: SuspiciousSummary) => {
    setDetailsDialog({ open: true, summary });
  };

  const closeDetailsDialog = () => {
    setDetailsDialog({ open: false, summary: null });
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
                  className={`p-4 rounded-lg border ${getSeverityColor(item.count)} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => openDetailsDialog(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.employee.name}</h3>
                        {getSeverityBadge(item.count)}
                        {item.highestConfidence && getConfidenceBadge(item.highestConfidence, item.highestConfidenceScore)}
                        <Badge variant="outline" className="text-xs">
                          {item.employee.employeeId}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1 mb-2">
                        <p>
                          <span className="font-medium">Department:</span> {item.employee.department}
                        </p>
                        <p>
                          <span className="font-medium">Date:</span>{' '}
                          {format(new Date(item.date), 'MMMM d, yyyy')}
                        </p>
                        {item.patterns.length > 0 && (
                          <p>
                            <span className="font-medium">Top Pattern:</span>{' '}
                            {getPatternIcon(item.patterns[0].type)} {getPatternTypeLabel(item.patterns[0].type)}
                          </p>
                        )}
                        {item.totalDurationMs > 0 && (
                          <p>
                            <span className="font-medium">Total Duration:</span>{' '}
                            {formatDuration(item.totalDurationMs)}
                          </p>
                        )}
                        {item.fingerprint && (
                          <p>
                            <span className="font-medium">Device:</span>{' '}
                            {getDeviceIcon(item.fingerprint.deviceType)} {item.fingerprint.browserName} on {item.fingerprint.osName}
                          </p>
                        )}
                        {item.uniqueIps.length > 0 && (
                          <p>
                            <span className="font-medium">IP{item.uniqueIps.length > 1 ? 's' : ''}:</span>{' '}
                            {item.uniqueIps.slice(0, 2).join(', ')}{item.uniqueIps.length > 2 ? ` +${item.uniqueIps.length - 2} more` : ''}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailsDialog(item);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-600">{item.count}</div>
                      <div className="text-xs text-gray-600">suspicious events</div>
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

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => !open && closeDetailsDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detailed Suspicious Activity Report</span>
              <Button variant="ghost" size="icon" onClick={closeDetailsDialog}>
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {detailsDialog.summary && (
            <div className="space-y-6">
              {/* Employee Info */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Employee</p>
                      <p className="font-semibold text-lg">{detailsDialog.summary.employee.name}</p>
                      <p className="text-sm text-gray-600">{detailsDialog.summary.employee.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-semibold">{detailsDialog.summary.employee.department}</p>
                      <p className="text-sm text-gray-600">{detailsDialog.summary.employee.designation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold">{format(new Date(detailsDialog.summary.date), 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Events</p>
                      <p className="font-semibold text-2xl text-red-600">{detailsDialog.summary.count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Detection Confidence</p>
                      <div className="flex items-center gap-2">
                        {detailsDialog.summary.highestConfidence ? (
                          getConfidenceBadge(detailsDialog.summary.highestConfidence, detailsDialog.summary.highestConfidenceScore)
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Duration</p>
                      <p className="font-semibold">{formatDuration(detailsDialog.summary.totalDurationMs)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Device Fingerprint */}
              {detailsDialog.summary.fingerprint && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-purple-900 mb-3">Device & Network Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-purple-600 text-xs">IP Address</p>
                        <p className="font-mono font-semibold">{detailsDialog.summary.fingerprint.ipAddress || 'Unknown'}</p>
                        {detailsDialog.summary.uniqueIps.length > 1 && (
                          <p className="text-xs text-purple-500 mt-1">
                            +{detailsDialog.summary.uniqueIps.length - 1} other IP(s): {detailsDialog.summary.uniqueIps.slice(1).join(', ')}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-purple-600 text-xs">Browser</p>
                        <p className="font-semibold">
                          {detailsDialog.summary.fingerprint.browserName} {detailsDialog.summary.fingerprint.browserVersion}
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-600 text-xs">Operating System</p>
                        <p className="font-semibold">
                          {detailsDialog.summary.fingerprint.osName} {detailsDialog.summary.fingerprint.osVersion}
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-600 text-xs">Device Type</p>
                        <p className="font-semibold">
                          {getDeviceIcon(detailsDialog.summary.fingerprint.deviceType)} {detailsDialog.summary.fingerprint.deviceType || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-600 text-xs">Screen Resolution</p>
                        <p className="font-semibold">{detailsDialog.summary.fingerprint.screenResolution || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-purple-600 text-xs">Timezone</p>
                        <p className="font-semibold">{detailsDialog.summary.fingerprint.timezone || 'Unknown'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pattern Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Detected Patterns</h3>
                {detailsDialog.summary.patterns.length > 0 ? (
                  <div className="space-y-4">
                    {detailsDialog.summary.patterns.map((pattern, idx) => {
                      const explanation = getPatternExplanation(pattern.type);
                      return (
                        <Card key={idx} className="border-l-4 border-red-500">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="text-3xl">{getPatternIcon(pattern.type)}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="destructive">{getPatternTypeLabel(pattern.type)}</Badge>
                                  {pattern.confidence && getConfidenceBadge(pattern.confidence, pattern.confidenceScore)}
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(pattern.timestamp), 'h:mm:ss a')}
                                  </span>
                                  {pattern.durationMs && pattern.durationMs > 0 && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                      Duration: {formatDuration(pattern.durationMs)}
                                    </span>
                                  )}
                                </div>

                                {/* Explanation section */}
                                <div className="space-y-2 mb-3">
                                  <h4 className="text-sm font-semibold text-gray-900">{explanation.title}</h4>
                                  <p className="text-sm text-gray-700">{explanation.description}</p>
                                  <div className="bg-red-50 border border-red-200 rounded p-2">
                                    <p className="text-xs font-medium text-red-800">Why this is concerning:</p>
                                    <p className="text-xs text-red-700 mt-1">{explanation.concern}</p>
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                    <p className="text-xs font-medium text-blue-800">Recommended action:</p>
                                    <p className="text-xs text-blue-700 mt-1">{explanation.recommendation}</p>
                                  </div>
                                </div>

                                {/* Raw detection details (collapsible) */}
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                    View technical details
                                  </summary>
                                  <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded mt-1">
                                    {pattern.details}
                                  </p>
                                </details>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No detailed pattern information available</p>
                )}
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Activity Timeline ({detailsDialog.summary.timestamps.length} events)</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-6 gap-2">
                    {detailsDialog.summary.timestamps.slice(0, 50).map((ts, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white px-2 py-1 rounded font-mono border border-gray-200"
                      >
                        {format(new Date(ts), 'HH:mm:ss')}
                      </span>
                    ))}
                  </div>
                  {detailsDialog.summary.timestamps.length > 50 && (
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      +{detailsDialog.summary.timestamps.length - 50} more events
                    </p>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Recommended Actions</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Review employee's work output for this date</li>
                    <li>• Check if automated tools were legitimately used for work</li>
                    <li>• Verify IP address and location during these events</li>
                    <li>• Consider discussing activity patterns with the employee</li>
                    <li>• Document findings for HR records</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Understanding Suspicious Activity Detection</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Keyboard Activity Patterns</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-lg">⌨️</span>
                  <div>
                    <strong>Repetitive Keystroke:</strong>
                    <p className="text-xs mt-0.5">Same key pressed 10+ times in a row. May indicate holding a key down artificially.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">⌨️</span>
                  <div>
                    <strong>Auto-Typer:</strong>
                    <p className="text-xs mt-0.5">Keys pressed at exact intervals. Real typing has natural variation - perfect timing is automated.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">⌨️</span>
                  <div>
                    <strong>Keyboard Macro:</strong>
                    <p className="text-xs mt-0.5">Two keys alternating perfectly (A-B-A-B). Common in gaming macros repurposed to fake work.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-blue-800 mb-2">Mouse Activity Patterns</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-lg">🖱️</span>
                  <div>
                    <strong>Mouse Jiggler:</strong>
                    <p className="text-xs mt-0.5">Mouse oscillating back and forth. Designed to prevent screen lock without actual work.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🖱️</span>
                  <div>
                    <strong>Linear Movement:</strong>
                    <p className="text-xs mt-0.5">Mouse moving in perfect straight lines. Natural mouse movement is curved and varied.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🖱️</span>
                  <div>
                    <strong>Static/Fake Mouse:</strong>
                    <p className="text-xs mt-0.5">Mouse events detected but cursor didn't actually move. Sophisticated activity simulation.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Confidence Levels Explained</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="bg-white rounded p-2 border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-red-600 text-white">HIGH (85%+)</Badge>
                </div>
                <p className="text-xs text-gray-700">Very likely automated activity. The pattern shows clear signs of software or hardware automation.</p>
              </div>
              <div className="bg-white rounded p-2 border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-orange-500 text-white">MEDIUM (65-84%)</Badge>
                </div>
                <p className="text-xs text-gray-700">Possibly automated. Some patterns match automation but could have legitimate explanations.</p>
              </div>
              <div className="bg-white rounded p-2 border border-yellow-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-yellow-500 text-black">LOW (&lt;65%)</Badge>
                </div>
                <p className="text-xs text-gray-700">Weak detection signal. May be a false positive from unusual but legitimate behavior.</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">How This Works</h4>
            <p className="text-xs text-blue-700">
              The system analyzes mouse movements, keystrokes, and clicks for patterns that are humanly impossible or extremely unlikely.
              For example, humans cannot click at exactly 2.000-second intervals or move a mouse in perfectly straight lines.
              When such patterns are detected, they are flagged for review.
            </p>
            <p className="text-xs text-blue-700 mt-2">
              <strong>Important:</strong> Detection is completely silent - employees are not notified when patterns are detected.
              Always review actual work output before drawing conclusions, as some legitimate workflows may trigger false positives.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
