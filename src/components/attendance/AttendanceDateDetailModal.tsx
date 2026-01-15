'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatHoursMinutes } from '@/lib/utils';
import { Clock, Coffee, Laptop, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
}

interface Break {
  id: string;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  reason?: string | null;
}

interface AttendanceDetail {
  id?: string;
  employee: Employee;
  status: string;
  punchIn?: Date | null;
  punchOut?: Date | null;
  breakStart?: Date | null;  // Legacy - for backward compatibility
  breakEnd?: Date | null;    // Legacy - for backward compatibility
  breaks?: Break[];          // New: array of breaks
  totalHours?: number | null;
  breakDuration?: number | null;
  idleTime?: number | null;
}

// Timeline segment component for visual representation
interface TimelineSegmentProps {
  startTime: Date;
  endTime: Date;
  type: 'work' | 'break' | 'idle';
  totalDayMinutes: number;
  dayStartTime: Date;
}

const TimelineSegment = ({ startTime, endTime, type, totalDayMinutes, dayStartTime }: TimelineSegmentProps) => {
  const startMinutes = (startTime.getTime() - dayStartTime.getTime()) / (1000 * 60);
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  const leftPercent = (startMinutes / totalDayMinutes) * 100;
  const widthPercent = (durationMinutes / totalDayMinutes) * 100;

  const colors = {
    work: 'bg-green-500',
    break: 'bg-orange-400',
    idle: 'bg-pink-400',
  };

  const labels = {
    work: 'Working',
    break: 'On Break',
    idle: 'Idle',
  };

  const formatTimeRange = () => {
    const start = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const end = endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  };

  return (
    <div
      className={`absolute h-full ${colors[type]} rounded-sm opacity-80 hover:opacity-100 cursor-pointer transition-opacity group`}
      style={{ left: `${Math.max(0, leftPercent)}%`, width: `${Math.max(0.5, widthPercent)}%` }}
      title={`${labels[type]}: ${formatTimeRange()}`}
    >
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          <div className="font-medium">{labels[type]}</div>
          <div>{formatTimeRange()}</div>
          <div>{Math.round(durationMinutes)} min</div>
        </div>
      </div>
    </div>
  );
};

// Visual Timeline component
interface VisualTimelineProps {
  attendance: AttendanceDetail;
}

const VisualTimeline = ({ attendance }: VisualTimelineProps) => {
  if (!attendance.punchIn) {
    return (
      <div className="text-sm text-gray-500 italic py-4">No punch-in data available</div>
    );
  }

  const punchIn = new Date(attendance.punchIn);
  const punchOut = attendance.punchOut ? new Date(attendance.punchOut) : new Date();

  // Get breaks from the new breaks array, or fallback to legacy breakStart/breakEnd
  const breaks: Array<{ start: Date; end: Date | null }> = [];

  if (attendance.breaks && attendance.breaks.length > 0) {
    // Use new breaks array
    attendance.breaks.forEach(brk => {
      breaks.push({
        start: new Date(brk.startTime),
        end: brk.endTime ? new Date(brk.endTime) : null,
      });
    });
  } else if (attendance.breakStart) {
    // Fallback to legacy single break
    breaks.push({
      start: new Date(attendance.breakStart),
      end: attendance.breakEnd ? new Date(attendance.breakEnd) : null,
    });
  }

  // Calculate timeline boundaries (round to nearest hour for display)
  const dayStartTime = new Date(punchIn);
  dayStartTime.setMinutes(0, 0, 0);

  const dayEndTime = new Date(punchOut);
  dayEndTime.setHours(dayEndTime.getHours() + 1, 0, 0, 0);

  const totalDayMinutes = (dayEndTime.getTime() - dayStartTime.getTime()) / (1000 * 60);

  // Generate hour markers
  const hourMarkers = [];
  let currentHour = new Date(dayStartTime);
  while (currentHour <= dayEndTime) {
    const leftPercent = ((currentHour.getTime() - dayStartTime.getTime()) / (dayEndTime.getTime() - dayStartTime.getTime())) * 100;
    hourMarkers.push({
      time: new Date(currentHour),
      leftPercent,
    });
    currentHour.setHours(currentHour.getHours() + 1);
  }

  // Build segments - interleave work and breaks
  const segments: Array<{ start: Date; end: Date; type: 'work' | 'break' | 'idle' }> = [];

  if (breaks.length === 0) {
    // No breaks, all work time
    segments.push({ start: punchIn, end: punchOut, type: 'work' });
  } else {
    // Sort breaks by start time
    const sortedBreaks = [...breaks].sort((a, b) => a.start.getTime() - b.start.getTime());

    let currentTime = punchIn;

    for (const brk of sortedBreaks) {
      // Work period before this break
      if (currentTime < brk.start) {
        segments.push({ start: currentTime, end: brk.start, type: 'work' });
      }

      // Break period
      const breakEnd = brk.end || punchOut;
      segments.push({ start: brk.start, end: breakEnd, type: 'break' });

      currentTime = breakEnd;
    }

    // Work period after last break
    if (currentTime < punchOut) {
      segments.push({ start: currentTime, end: punchOut, type: 'work' });
    }
  }

  return (
    <div className="my-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Day Timeline</span>
        {breaks.length > 0 && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
            {breaks.length} break{breaks.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Timeline container */}
      <div className="relative">
        {/* Hour markers */}
        <div className="relative h-4 text-xs text-gray-500">
          {hourMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2"
              style={{ left: `${marker.leftPercent}%` }}
            >
              {marker.time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
            </div>
          ))}
        </div>

        {/* Timeline bar */}
        <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden mt-1">
          {segments.map((seg, idx) => (
            <TimelineSegment
              key={idx}
              startTime={seg.start}
              endTime={seg.end}
              type={seg.type}
              totalDayMinutes={totalDayMinutes}
              dayStartTime={dayStartTime}
            />
          ))}
        </div>

        {/* Tick marks */}
        <div className="relative h-2">
          {hourMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute w-px h-full bg-gray-300"
              style={{ left: `${marker.leftPercent}%` }}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <span className="text-gray-600">Working</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-400 rounded-sm" />
          <span className="text-gray-600">Break</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-pink-400 rounded-sm" />
          <span className="text-gray-600">Idle</span>
        </div>
      </div>

      {/* Time summary cards */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        <div className="bg-gray-50 p-2 rounded-lg text-center">
          <div className="text-xs text-gray-500">Punch In</div>
          <div className="text-sm font-semibold text-gray-900">
            {punchIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg text-center">
          <div className="text-xs text-gray-500">Punch Out</div>
          <div className="text-sm font-semibold text-gray-900">
            {attendance.punchOut
              ? punchOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : 'Still working'}
          </div>
        </div>
        <div className="bg-orange-50 p-2 rounded-lg text-center">
          <div className="text-xs text-orange-600 flex items-center justify-center gap-1">
            <Coffee className="h-3 w-3" /> Break{breaks.length > 1 ? 's' : ''}
          </div>
          <div className="text-sm font-semibold text-orange-700">
            {formatHoursMinutes(attendance.breakDuration)}
          </div>
        </div>
        <div className="bg-pink-50 p-2 rounded-lg text-center">
          <div className="text-xs text-pink-600 flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Idle
          </div>
          <div className="text-sm font-semibold text-pink-700">
            {formatHoursMinutes(attendance.idleTime)}
          </div>
        </div>
      </div>

      {/* Break details list */}
      {breaks.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Break Details:</div>
          <div className="space-y-1">
            {breaks.map((brk, idx) => {
              const duration = brk.end
                ? (brk.end.getTime() - brk.start.getTime()) / (1000 * 60)
                : null;
              return (
                <div key={idx} className="flex items-center justify-between text-xs bg-orange-50 px-2 py-1 rounded">
                  <span className="text-orange-700">
                    Break {idx + 1}: {brk.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {brk.end
                      ? brk.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : 'ongoing'}
                  </span>
                  <span className="text-orange-600 font-medium">
                    {duration ? `${Math.round(duration)} min` : 'In progress'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface AttendanceDateDetailModalProps {
  date: Date | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceDateDetailModal({ date, isOpen, onClose }: AttendanceDateDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceDetail[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  useEffect(() => {
    if (date && isOpen) {
      fetchAttendanceData();
    }
  }, [date, isOpen]);

  const fetchAttendanceData = async () => {
    if (!date) return;

    setLoading(true);
    try {
      // Use local date methods to avoid timezone issues
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const response = await fetch(`/api/attendance?date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
      }

      // Fetch all employees
      const empResponse = await fetch('/api/employees');
      if (empResponse.ok) {
        const employees = await empResponse.json();
        setAllEmployees(employees);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!date) return null;

  const presentEmployees = attendanceData.filter(a => a.status === 'PRESENT');
  const halfDayEmployees = attendanceData.filter(a => a.status === 'HALF_DAY');
  const leaveEmployees = attendanceData.filter(a => a.status === 'LEAVE');
  const absentEmployeeIds = attendanceData.map(a => a.employee.id);
  const absentEmployees = allEmployees.filter(emp => !absentEmployeeIds.includes(emp.id));

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Attendance for {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{presentEmployees.length}</div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-600">{halfDayEmployees.length}</div>
                <div className="text-sm text-gray-600">Half Day</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{leaveEmployees.length}</div>
                <div className="text-sm text-gray-600">On Leave</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600">{absentEmployees.length}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>
            </div>

            <Tabs defaultValue="present" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="present">Present ({presentEmployees.length})</TabsTrigger>
                <TabsTrigger value="halfday">Half Day ({halfDayEmployees.length})</TabsTrigger>
                <TabsTrigger value="leave">Leave ({leaveEmployees.length})</TabsTrigger>
                <TabsTrigger value="absent">Absent ({absentEmployees.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="present" className="space-y-2 mt-4">
                {presentEmployees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No employees present</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Employee</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Punch In</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Punch Out</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Work Hours</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Break</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Idle</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {presentEmployees.map((att) => {
                          const isExpanded = expandedEmployee === att.employee.id;
                          return (
                            <React.Fragment key={att.employee.id}>
                              <tr
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => setExpandedEmployee(isExpanded ? null : att.employee.id)}
                              >
                                <td className="px-3 py-2 text-sm">
                                  <div>
                                    <div className="font-medium">{att.employee.name}</div>
                                    <div className="text-xs text-gray-500">{att.employee.employeeId} • {att.employee.designation}</div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm">{formatTime(att.punchIn)}</td>
                                <td className="px-3 py-2 text-sm">{formatTime(att.punchOut)}</td>
                                <td className="px-3 py-2 text-sm font-semibold text-green-600">
                                  {formatHoursMinutes(att.totalHours)}
                                </td>
                                <td className="px-3 py-2 text-sm text-orange-600">
                                  {formatHoursMinutes(att.breakDuration)}
                                </td>
                                <td className="px-3 py-2 text-sm text-pink-600">
                                  {formatHoursMinutes(att.idleTime)}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  <button
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedEmployee(isExpanded ? null : att.employee.id);
                                    }}
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="h-4 w-4" />
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-4 w-4" />
                                        View
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-blue-50">
                                  <td colSpan={7} className="px-3 py-2">
                                    <VisualTimeline attendance={att} />
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="halfday" className="space-y-2 mt-4">
                {halfDayEmployees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No half day records</div>
                ) : (
                  <div className="space-y-2">
                    {halfDayEmployees.map((att) => (
                      <div key={att.employee.id} className="border rounded-lg p-3 bg-yellow-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{att.employee.name}</div>
                            <div className="text-sm text-gray-600">{att.employee.employeeId} • {att.employee.designation}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div>Work: {formatHoursMinutes(att.totalHours)}</div>
                            <div className="text-xs text-gray-500">{formatTime(att.punchIn)} - {formatTime(att.punchOut)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="leave" className="space-y-2 mt-4">
                {leaveEmployees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No employees on leave</div>
                ) : (
                  <div className="space-y-2">
                    {leaveEmployees.map((att) => (
                      <div key={att.employee.id} className="border rounded-lg p-3 bg-blue-50">
                        <div className="font-medium">{att.employee.name}</div>
                        <div className="text-sm text-gray-600">{att.employee.employeeId} • {att.employee.designation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="absent" className="space-y-2 mt-4">
                {absentEmployees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No absent employees</div>
                ) : (
                  <div className="space-y-2">
                    {absentEmployees.map((emp) => (
                      <div key={emp.id} className="border rounded-lg p-3 bg-red-50">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-gray-600">{emp.employeeId} • {emp.designation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
