/**
 * Attendance Slice
 * Redux state management for attendance tracking
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { attendanceService } from '@/services';
import type { AttendanceWithRelations, Break, AttendanceSummary } from '@/types/models';

interface AttendanceState {
  todayAttendance: AttendanceWithRelations | null;
  attendanceHistory: AttendanceWithRelations[];
  summary: AttendanceSummary | null;
  isPunchedIn: boolean;
  isOnBreak: boolean;
  isLoading: boolean;
  isHeartbeatActive: boolean;
  lastHeartbeat: string | null;
  error: string | null;
}

const initialState: AttendanceState = {
  todayAttendance: null,
  attendanceHistory: [],
  summary: null,
  isPunchedIn: false,
  isOnBreak: false,
  isLoading: false,
  isHeartbeatActive: false,
  lastHeartbeat: null,
  error: null,
};

// Async thunks
export const fetchTodayAttendance = createAsyncThunk(
  'attendance/fetchToday',
  async (employeeId: string, { rejectWithValue }) => {
    const result = await attendanceService.getTodayAttendance(employeeId);
    if (!result.success) {
      return rejectWithValue(result.error || 'Failed to fetch attendance');
    }
    return result.data;
  }
);

export const fetchAttendanceHistory = createAsyncThunk(
  'attendance/fetchHistory',
  async (
    params: { employeeId: string; startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    const result = await attendanceService.getAttendanceByDateRange(
      params.startDate,
      params.endDate,
      params.employeeId
    );
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to fetch attendance history');
    }
    return result.data;
  }
);

export const fetchAttendanceSummary = createAsyncThunk(
  'attendance/fetchSummary',
  async (
    params: { employeeId: string; startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    const result = await attendanceService.getAttendanceSummary(
      params.employeeId,
      params.startDate,
      params.endDate
    );
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to fetch summary');
    }
    return result.data;
  }
);

export const punchIn = createAsyncThunk(
  'attendance/punchIn',
  async (_, { rejectWithValue }) => {
    const result = await attendanceService.punchIn();
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to punch in');
    }
    return result.data;
  }
);

export const punchOut = createAsyncThunk(
  'attendance/punchOut',
  async (_, { rejectWithValue }) => {
    const result = await attendanceService.punchOut();
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to punch out');
    }
    return result.data;
  }
);

export const startBreak = createAsyncThunk(
  'attendance/startBreak',
  async (_, { rejectWithValue }) => {
    const result = await attendanceService.startBreak();
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to start break');
    }
    return result.data;
  }
);

export const endBreak = createAsyncThunk(
  'attendance/endBreak',
  async (_, { rejectWithValue }) => {
    const result = await attendanceService.endBreak();
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to end break');
    }
    return result.data;
  }
);

export const sendHeartbeat = createAsyncThunk(
  'attendance/sendHeartbeat',
  async (active: boolean, { rejectWithValue }) => {
    const result = await attendanceService.sendHeartbeat(active);
    if (!result.success) {
      return rejectWithValue(result.error || 'Failed to send heartbeat');
    }
    return active;
  }
);

// Slice
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    // Clear attendance data (on logout)
    clearAttendanceData: (state) => {
      state.todayAttendance = null;
      state.attendanceHistory = [];
      state.summary = null;
      state.isPunchedIn = false;
      state.isOnBreak = false;
      state.error = null;
    },
    // Set punched in status
    setPunchedIn: (state, action: PayloadAction<boolean>) => {
      state.isPunchedIn = action.payload;
    },
    // Set on break status
    setOnBreak: (state, action: PayloadAction<boolean>) => {
      state.isOnBreak = action.payload;
    },
    // Update today's attendance
    updateTodayAttendance: (state, action: PayloadAction<Partial<AttendanceWithRelations>>) => {
      if (state.todayAttendance) {
        state.todayAttendance = { ...state.todayAttendance, ...action.payload };
      }
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Start heartbeat tracking
    startHeartbeat: (state) => {
      state.isHeartbeatActive = true;
    },
    // Stop heartbeat tracking
    stopHeartbeat: (state) => {
      state.isHeartbeatActive = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch today's attendance
    builder
      .addCase(fetchTodayAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayAttendance = action.payload || null;
        state.isPunchedIn = !!(action.payload?.punchIn && !action.payload?.punchOut);

        // Check if on break
        if (action.payload?.breaks) {
          const activeBreak = action.payload.breaks.find(
            (b: Break) => b.startTime && !b.endTime
          );
          state.isOnBreak = !!activeBreak;
        }
      })
      .addCase(fetchTodayAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch attendance history
    builder
      .addCase(fetchAttendanceHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceHistory = action.payload;
      })
      .addCase(fetchAttendanceHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch summary
    builder
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });

    // Punch in
    builder
      .addCase(punchIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(punchIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayAttendance = action.payload as unknown as AttendanceWithRelations;
        state.isPunchedIn = true;
      })
      .addCase(punchIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Punch out
    builder
      .addCase(punchOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(punchOut.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayAttendance = action.payload as unknown as AttendanceWithRelations;
        state.isPunchedIn = false;
        state.isOnBreak = false;
      })
      .addCase(punchOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Start break
    builder
      .addCase(startBreak.fulfilled, (state, action) => {
        state.isOnBreak = true;
        if (state.todayAttendance) {
          state.todayAttendance.breaks = [
            ...(state.todayAttendance.breaks || []),
            action.payload as unknown as Break,
          ];
        }
      });

    // End break
    builder
      .addCase(endBreak.fulfilled, (state, action) => {
        state.isOnBreak = false;
        if (state.todayAttendance?.breaks) {
          const updatedBreak = action.payload as unknown as Break;
          state.todayAttendance.breaks = state.todayAttendance.breaks.map((b) =>
            b.id === updatedBreak.id ? updatedBreak : b
          );
        }
      });

    // Send heartbeat
    builder
      .addCase(sendHeartbeat.fulfilled, (state) => {
        state.lastHeartbeat = new Date().toISOString();
      });
  },
});

export const {
  clearAttendanceData,
  setPunchedIn,
  setOnBreak,
  updateTodayAttendance,
  clearError,
  startHeartbeat,
  stopHeartbeat,
} = attendanceSlice.actions;

// Selectors
export const selectTodayAttendance = (state: { attendance: AttendanceState }) =>
  state.attendance.todayAttendance;
export const selectAttendanceHistory = (state: { attendance: AttendanceState }) =>
  state.attendance.attendanceHistory;
export const selectAttendanceSummary = (state: { attendance: AttendanceState }) =>
  state.attendance.summary;
export const selectIsPunchedIn = (state: { attendance: AttendanceState }) =>
  state.attendance.isPunchedIn;
export const selectIsOnBreak = (state: { attendance: AttendanceState }) =>
  state.attendance.isOnBreak;
export const selectAttendanceIsLoading = (state: { attendance: AttendanceState }) =>
  state.attendance.isLoading;
export const selectAttendanceError = (state: { attendance: AttendanceState }) =>
  state.attendance.error;
export const selectIsHeartbeatActive = (state: { attendance: AttendanceState }) =>
  state.attendance.isHeartbeatActive;

export default attendanceSlice.reducer;
