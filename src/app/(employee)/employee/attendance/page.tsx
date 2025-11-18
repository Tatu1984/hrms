'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: Date;
  punchIn: Date | null;
  punchOut: Date | null;
  status: string;
  totalHours?: number | null;
}

export default function EmployeeAttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthAttendance();
    fetchHolidays();
  }, [currentMonth]);

  const fetchMonthAttendance = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const response = await fetch(
        `/api/attendance?startDate=${startDate}&endDate=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const year = currentMonth.getFullYear();
      const response = await fetch(`/api/holidays?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getAttendanceForDate = (date: Date) => {
    return attendanceRecords.find((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getDate() === date.getDate() &&
        recordDate.getMonth() === date.getMonth() &&
        recordDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isWeekend = (date: Date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  };

  const isHoliday = (date: Date) => {
    return holidays.some((holiday) => {
      const holidayDate = new Date(holiday.date);
      return (
        holidayDate.getDate() === date.getDate() &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'PRESENT') return 'default';
    if (status === 'HALF_DAY') return 'secondary';
    if (status === 'LEAVE') return 'outline';
    if (status === 'WEEKEND') return 'secondary';
    if (status === 'HOLIDAY') return 'outline';
    return 'destructive'; // ABSENT
  };

  // Generate all dates to display
  const generateDatesList = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isCurrentMonth =
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();

    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = isCurrentMonth
      ? today
      : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      dates.push(date);
    }

    return dates.reverse(); // Most recent first
  };

  const allDates = generateDatesList();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-gray-600">View your attendance history</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading attendance data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Punch In</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Punch Out</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allDates.map((date) => {
                    const attendance = getAttendanceForDate(date);
                    const weekend = isWeekend(date);
                    const holiday = isHoliday(date);

                    // Determine status to display
                    let displayStatus = 'ABSENT';
                    if (attendance) {
                      displayStatus = attendance.status;
                    } else if (holiday) {
                      displayStatus = 'HOLIDAY';
                    } else if (weekend) {
                      displayStatus = 'WEEKEND';
                    }

                    return (
                      <tr key={date.toISOString()} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{formatDate(date.toString())}</td>
                        <td className="px-4 py-3 text-sm">
                          {attendance?.punchIn ? formatDateTime(attendance.punchIn.toString()) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {attendance?.punchOut ? formatDateTime(attendance.punchOut.toString()) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {attendance?.totalHours ? attendance.totalHours.toFixed(2) : '-'} hrs
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={getStatusBadgeVariant(displayStatus)}>
                            {displayStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
