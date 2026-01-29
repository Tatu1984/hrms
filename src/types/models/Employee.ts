/**
 * Employee Domain Model
 * Type definitions for Employee entity
 */

export type SalaryType = 'FIXED' | 'VARIABLE';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string | null;
  address: string;
  designation: string;
  salary: number;
  variablePay?: number | null;
  department: string;
  employeeType?: string | null;
  salesTarget?: number | null;
  reportingHeadId?: string | null;
  dateOfJoining: Date | string;
  profilePicture?: string | null;
  documents?: unknown | null;
  aadharNumber?: string | null;
  panNumber?: string | null;
  aadharDocument?: string | null;
  panDocument?: string | null;
  bankName?: string | null;
  bankAddress?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  salaryType: SalaryType;
  isActive: boolean;
  altEmail?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  designation: string;
  salary: number;
  department: string;
  dateOfJoining: Date | string;
  employeeType?: string;
  salaryType?: SalaryType;
  variablePay?: number;
  salesTarget?: number;
  reportingHeadId?: string;
  altPhone?: string;
  altEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  isActive?: boolean;
  profilePicture?: string;
  aadharNumber?: string;
  panNumber?: string;
  bankName?: string;
  bankAddress?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export interface EmployeeWithRelations extends Employee {
  reportingHead?: Employee | null;
  subordinates?: Employee[];
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export interface BankingDetails {
  id: string;
  employeeId: string;
  bankName: string;
  branchName?: string | null;
  accountHolderName: string;
  accountNumber: string;
  accountType?: string | null;
  ifscCode: string;
  swiftCode?: string | null;
  upiId?: string | null;
  panNumber?: string | null;
  pfAccountNumber?: string | null;
  esiNumber?: string | null;
  uanNumber?: string | null;
  isVerified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type DocumentType =
  | 'AADHAR_CARD'
  | 'PAN_CARD'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'VOTER_ID'
  | 'TENTH_MARKSHEET'
  | 'TWELFTH_MARKSHEET'
  | 'GRADUATION_DEGREE'
  | 'POST_GRADUATION_DEGREE'
  | 'OTHER_CERTIFICATE'
  | 'OFFER_LETTER'
  | 'APPOINTMENT_LETTER'
  | 'EXPERIENCE_LETTER'
  | 'RELIEVING_LETTER'
  | 'SALARY_SLIP'
  | 'FORM_16'
  | 'BANK_STATEMENT'
  | 'CANCELLED_CHEQUE'
  | 'ADDRESS_PROOF'
  | 'PROFILE_PHOTO'
  | 'RESUME'
  | 'OTHER';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: DocumentType;
  documentName: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  documentNumber?: string | null;
  issuedDate?: Date | string | null;
  expiryDate?: Date | string | null;
  issuingAuthority?: string | null;
  isVerified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;
  notes?: string | null;
  uploadedBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
