/**
 * User Slice
 * Redux state management for user/employee profile data
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { employeeService } from '@/services';
import type { Employee, EmployeeWithRelations, BankingDetails, EmployeeDocument } from '@/types/models';

interface UserState {
  employee: EmployeeWithRelations | null;
  bankingDetails: BankingDetails | null;
  documents: EmployeeDocument[];
  isLoading: boolean;
  isLoadingBanking: boolean;
  isLoadingDocuments: boolean;
  error: string | null;
}

const initialState: UserState = {
  employee: null,
  bankingDetails: null,
  documents: [],
  isLoading: false,
  isLoadingBanking: false,
  isLoadingDocuments: false,
  error: null,
};

// Async thunks
export const fetchEmployeeProfile = createAsyncThunk(
  'user/fetchEmployeeProfile',
  async (employeeId: string, { rejectWithValue }) => {
    const result = await employeeService.getEmployeeById(employeeId);
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to fetch profile');
    }
    return result.data;
  }
);

export const updateEmployeeProfile = createAsyncThunk(
  'user/updateEmployeeProfile',
  async ({ id, data }: { id: string; data: Partial<Employee> }, { rejectWithValue }) => {
    const result = await employeeService.updateEmployee(id, data);
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to update profile');
    }
    return result.data;
  }
);

export const fetchBankingDetails = createAsyncThunk(
  'user/fetchBankingDetails',
  async (employeeId: string, { rejectWithValue }) => {
    const result = await employeeService.getBankingDetails(employeeId);
    if (!result.success) {
      return rejectWithValue(result.error || 'Failed to fetch banking details');
    }
    return result.data;
  }
);

export const updateBankingDetails = createAsyncThunk(
  'user/updateBankingDetails',
  async (
    { employeeId, data }: { employeeId: string; data: Partial<BankingDetails> },
    { rejectWithValue }
  ) => {
    const result = await employeeService.updateBankingDetails(employeeId, data);
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to update banking details');
    }
    return result.data;
  }
);

export const fetchDocuments = createAsyncThunk(
  'user/fetchDocuments',
  async (employeeId: string, { rejectWithValue }) => {
    const result = await employeeService.getDocuments(employeeId);
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to fetch documents');
    }
    return result.data;
  }
);

export const uploadDocument = createAsyncThunk(
  'user/uploadDocument',
  async (
    { employeeId, file, documentType }: { employeeId: string; file: File; documentType: string },
    { rejectWithValue }
  ) => {
    const result = await employeeService.uploadDocument(employeeId, file, documentType);
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to upload document');
    }
    return result.data;
  }
);

export const deleteDocument = createAsyncThunk(
  'user/deleteDocument',
  async (
    { employeeId, documentId }: { employeeId: string; documentId: string },
    { rejectWithValue }
  ) => {
    const result = await employeeService.deleteDocument(employeeId, documentId);
    if (!result.success) {
      return rejectWithValue(result.error || 'Failed to delete document');
    }
    return documentId;
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Clear user data (on logout)
    clearUserData: (state) => {
      state.employee = null;
      state.bankingDetails = null;
      state.documents = [];
      state.error = null;
    },
    // Set employee data directly
    setEmployee: (state, action: PayloadAction<EmployeeWithRelations | null>) => {
      state.employee = action.payload;
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch employee profile
    builder
      .addCase(fetchEmployeeProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employee = action.payload;
      })
      .addCase(fetchEmployeeProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update employee profile
    builder
      .addCase(updateEmployeeProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmployeeProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.employee) {
          state.employee = { ...state.employee, ...action.payload };
        }
      })
      .addCase(updateEmployeeProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch banking details
    builder
      .addCase(fetchBankingDetails.pending, (state) => {
        state.isLoadingBanking = true;
      })
      .addCase(fetchBankingDetails.fulfilled, (state, action) => {
        state.isLoadingBanking = false;
        state.bankingDetails = action.payload || null;
      })
      .addCase(fetchBankingDetails.rejected, (state, action) => {
        state.isLoadingBanking = false;
        state.error = action.payload as string;
      });

    // Update banking details
    builder
      .addCase(updateBankingDetails.pending, (state) => {
        state.isLoadingBanking = true;
      })
      .addCase(updateBankingDetails.fulfilled, (state, action) => {
        state.isLoadingBanking = false;
        state.bankingDetails = action.payload;
      })
      .addCase(updateBankingDetails.rejected, (state, action) => {
        state.isLoadingBanking = false;
        state.error = action.payload as string;
      });

    // Fetch documents
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoadingDocuments = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoadingDocuments = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoadingDocuments = false;
        state.error = action.payload as string;
      });

    // Upload document
    builder
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.documents.push(action.payload);
      });

    // Delete document
    builder
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((doc) => doc.id !== action.payload);
      });
  },
});

export const { clearUserData, setEmployee, clearError } = userSlice.actions;

// Selectors
export const selectEmployee = (state: { user: UserState }) => state.user.employee;
export const selectBankingDetails = (state: { user: UserState }) => state.user.bankingDetails;
export const selectDocuments = (state: { user: UserState }) => state.user.documents;
export const selectUserIsLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;

export default userSlice.reducer;
