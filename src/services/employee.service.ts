/**
 * Employee Service
 * Business logic for employee management
 */

import { employeesApi } from '@/lib/api';
import type { ApiResponse, PaginatedResponse, EmployeeListParams } from '@/lib/api';
import type {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeWithRelations,
  BankingDetails,
  EmployeeDocument,
} from '@/types/models';

class EmployeeService {
  /**
   * Get paginated list of employees
   */
  async getEmployees(params?: EmployeeListParams): Promise<ApiResponse<PaginatedResponse<Employee>>> {
    return employeesApi.list(params) as Promise<ApiResponse<PaginatedResponse<Employee>>>;
  }

  /**
   * Get active employees only
   */
  async getActiveEmployees(params?: Omit<EmployeeListParams, 'isActive'>): Promise<ApiResponse<PaginatedResponse<Employee>>> {
    return this.getEmployees({ ...params, isActive: true });
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<ApiResponse<EmployeeWithRelations>> {
    return employeesApi.getById(id) as Promise<ApiResponse<EmployeeWithRelations>>;
  }

  /**
   * Create new employee
   */
  async createEmployee(data: CreateEmployeeInput): Promise<ApiResponse<Employee>> {
    return employeesApi.create(data) as Promise<ApiResponse<Employee>>;
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, data: UpdateEmployeeInput): Promise<ApiResponse<Employee>> {
    return employeesApi.update(id, data) as Promise<ApiResponse<Employee>>;
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    return employeesApi.delete(id) as Promise<ApiResponse<void>>;
  }

  /**
   * Toggle employee active status
   */
  async toggleActive(id: string): Promise<ApiResponse<Employee>> {
    return employeesApi.toggleActive(id) as Promise<ApiResponse<Employee>>;
  }

  /**
   * Get employee banking details
   */
  async getBankingDetails(employeeId: string): Promise<ApiResponse<BankingDetails>> {
    return employeesApi.getBanking(employeeId) as Promise<ApiResponse<BankingDetails>>;
  }

  /**
   * Update employee banking details
   */
  async updateBankingDetails(employeeId: string, data: Partial<BankingDetails>): Promise<ApiResponse<BankingDetails>> {
    return employeesApi.updateBanking(employeeId, data) as Promise<ApiResponse<BankingDetails>>;
  }

  /**
   * Get employee documents
   */
  async getDocuments(employeeId: string): Promise<ApiResponse<EmployeeDocument[]>> {
    return employeesApi.getDocuments(employeeId) as Promise<ApiResponse<EmployeeDocument[]>>;
  }

  /**
   * Upload employee document
   */
  async uploadDocument(employeeId: string, file: File, documentType: string): Promise<ApiResponse<EmployeeDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return employeesApi.uploadDocument(employeeId, formData) as Promise<ApiResponse<EmployeeDocument>>;
  }

  /**
   * Delete employee document
   */
  async deleteDocument(employeeId: string, documentId: string): Promise<ApiResponse<void>> {
    return employeesApi.deleteDocument(employeeId, documentId) as Promise<ApiResponse<void>>;
  }

  /**
   * Get employees by department
   */
  async getByDepartment(department: string): Promise<ApiResponse<PaginatedResponse<Employee>>> {
    return this.getEmployees({ department, isActive: true });
  }

  /**
   * Search employees by name or email
   */
  async searchEmployees(query: string): Promise<ApiResponse<PaginatedResponse<Employee>>> {
    return this.getEmployees({ search: query, isActive: true });
  }

  /**
   * Get employee's subordinates (if they are a reporting head)
   */
  async getSubordinates(employeeId: string): Promise<ApiResponse<Employee[]>> {
    const result = await this.getEmployees({ isActive: true });
    if (!result.success || !result.data) {
      return result as ApiResponse<Employee[]>;
    }

    const subordinates = result.data.data.filter(
      (emp) => emp.reportingHeadId === employeeId
    );

    return {
      success: true,
      data: subordinates,
    };
  }
}

// Export singleton instance
export const employeeService = new EmployeeService();

// Export class for testing
export { EmployeeService };
