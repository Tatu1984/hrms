'use client';

/**
 * useEmployee Hook
 * Current employee profile data and actions
 */

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchEmployeeProfile,
  updateEmployeeProfile,
  fetchBankingDetails,
  updateBankingDetails,
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  clearUserData,
  setEmployee,
  selectEmployee,
  selectBankingDetails,
  selectDocuments,
  selectUserIsLoading,
  selectUserError,
} from '@/store/slices/userSlice';
import { useAuth } from './useAuth';
import type { Employee, BankingDetails } from '@/types/models';

export function useEmployee() {
  const dispatch = useAppDispatch();
  const { user, employeeId } = useAuth();

  // Selectors
  const employee = useAppSelector(selectEmployee);
  const bankingDetails = useAppSelector(selectBankingDetails);
  const documents = useAppSelector(selectDocuments);
  const isLoading = useAppSelector(selectUserIsLoading);
  const error = useAppSelector(selectUserError);

  // Auto-fetch employee profile when employeeId is available
  useEffect(() => {
    if (employeeId && !employee) {
      dispatch(fetchEmployeeProfile(employeeId));
    }
  }, [dispatch, employeeId, employee]);

  // Fetch employee profile
  const fetchProfile = useCallback(
    (id?: string) => {
      const targetId = id || employeeId;
      if (targetId) {
        return dispatch(fetchEmployeeProfile(targetId));
      }
    },
    [dispatch, employeeId]
  );

  // Update employee profile
  const updateProfile = useCallback(
    (data: Partial<Employee>) => {
      if (employee?.id) {
        return dispatch(updateEmployeeProfile({ id: employee.id, data }));
      }
    },
    [dispatch, employee?.id]
  );

  // Fetch banking details
  const fetchBanking = useCallback(() => {
    if (employeeId) {
      return dispatch(fetchBankingDetails(employeeId));
    }
  }, [dispatch, employeeId]);

  // Update banking details
  const updateBanking = useCallback(
    (data: Partial<BankingDetails>) => {
      if (employeeId) {
        return dispatch(updateBankingDetails({ employeeId, data }));
      }
    },
    [dispatch, employeeId]
  );

  // Fetch documents
  const fetchDocs = useCallback(() => {
    if (employeeId) {
      return dispatch(fetchDocuments(employeeId));
    }
  }, [dispatch, employeeId]);

  // Upload document
  const uploadDoc = useCallback(
    (file: File, documentType: string) => {
      if (employeeId) {
        return dispatch(uploadDocument({ employeeId, file, documentType }));
      }
    },
    [dispatch, employeeId]
  );

  // Delete document
  const deleteDoc = useCallback(
    (documentId: string) => {
      if (employeeId) {
        return dispatch(deleteDocument({ employeeId, documentId }));
      }
    },
    [dispatch, employeeId]
  );

  // Set employee directly
  const setCurrentEmployee = useCallback(
    (employeeData: typeof employee) => {
      dispatch(setEmployee(employeeData));
    },
    [dispatch]
  );

  // Clear data
  const clearData = useCallback(() => {
    dispatch(clearUserData());
  }, [dispatch]);

  // Computed properties
  const fullName = employee?.name || user?.name || '';
  const designation = employee?.designation || '';
  const department = employee?.department || '';
  const isActive = employee?.isActive ?? true;

  return {
    // State
    employee,
    bankingDetails,
    documents,
    isLoading,
    error,

    // Computed
    fullName,
    designation,
    department,
    isActive,
    employeeId: employee?.employeeId || employeeId,

    // Profile actions
    fetchProfile,
    updateProfile,
    setCurrentEmployee,

    // Banking actions
    fetchBanking,
    updateBanking,

    // Document actions
    fetchDocuments: fetchDocs,
    uploadDocument: uploadDoc,
    deleteDocument: deleteDoc,

    // Clear
    clearData,
  };
}

export default useEmployee;
