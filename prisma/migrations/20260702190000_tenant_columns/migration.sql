-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "CompanyBankAccount" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "DailyWorkUpdate" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Designation" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "HRDocument" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Holiday" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "IntegrationConnection" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "LeaveBalance" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "LeavePolicy" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "SalaryConfig" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "Attendance_organizationId_idx" ON "Attendance"("organizationId");

-- CreateIndex
CREATE INDEX "CompanyBankAccount_organizationId_idx" ON "CompanyBankAccount"("organizationId");

-- CreateIndex
CREATE INDEX "CompanyProfile_organizationId_idx" ON "CompanyProfile"("organizationId");

-- CreateIndex
CREATE INDEX "DailyWorkUpdate_organizationId_idx" ON "DailyWorkUpdate"("organizationId");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE INDEX "Designation_organizationId_idx" ON "Designation"("organizationId");

-- CreateIndex
CREATE INDEX "HRDocument_organizationId_idx" ON "HRDocument"("organizationId");

-- CreateIndex
CREATE INDEX "Holiday_organizationId_idx" ON "Holiday"("organizationId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_organizationId_idx" ON "IntegrationConnection"("organizationId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_idx" ON "Lead"("organizationId");

-- CreateIndex
CREATE INDEX "Leave_organizationId_idx" ON "Leave"("organizationId");

-- CreateIndex
CREATE INDEX "LeaveBalance_organizationId_idx" ON "LeaveBalance"("organizationId");

-- CreateIndex
CREATE INDEX "LeavePolicy_organizationId_idx" ON "LeavePolicy"("organizationId");

-- CreateIndex
CREATE INDEX "Message_organizationId_idx" ON "Message"("organizationId");

-- CreateIndex
CREATE INDEX "Payroll_organizationId_idx" ON "Payroll"("organizationId");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "Report_organizationId_idx" ON "Report"("organizationId");

-- CreateIndex
CREATE INDEX "SalaryConfig_organizationId_idx" ON "SalaryConfig"("organizationId");

-- CreateIndex
CREATE INDEX "Sale_organizationId_idx" ON "Sale"("organizationId");

-- CreateIndex
CREATE INDEX "Task_organizationId_idx" ON "Task"("organizationId");


-- Backfill existing rows to the default organization.
UPDATE "Attendance" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "CompanyBankAccount" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "CompanyProfile" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "DailyWorkUpdate" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Department" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Designation" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "HRDocument" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Holiday" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "IntegrationConnection" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Invoice" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Lead" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Leave" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "LeaveBalance" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "LeavePolicy" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Message" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Payroll" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Project" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Report" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "SalaryConfig" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Sale" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "Task" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
