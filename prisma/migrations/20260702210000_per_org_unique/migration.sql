-- DropIndex
DROP INDEX "public"."Department_code_key";

-- DropIndex
DROP INDEX "public"."Department_name_key";

-- DropIndex
DROP INDEX "public"."Designation_name_key";

-- DropIndex
DROP INDEX "public"."Employee_email_key";

-- DropIndex
DROP INDEX "public"."Employee_employeeId_key";

-- DropIndex
DROP INDEX "public"."Invoice_invoiceNumber_key";

-- DropIndex
DROP INDEX "public"."Lead_leadNumber_key";

-- DropIndex
DROP INDEX "public"."LeavePolicy_leaveType_key";

-- DropIndex
DROP INDEX "public"."Project_projectId_key";

-- DropIndex
DROP INDEX "public"."Sale_saleNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_name_key" ON "Department"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_code_key" ON "Department"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_organizationId_name_key" ON "Designation"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_employeeId_key" ON "Employee"("organizationId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_email_key" ON "Employee"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_invoiceNumber_key" ON "Invoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_organizationId_leadNumber_key" ON "Lead"("organizationId", "leadNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_organizationId_leaveType_key" ON "LeavePolicy"("organizationId", "leaveType");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_projectId_key" ON "Project"("organizationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_organizationId_saleNumber_key" ON "Sale"("organizationId", "saleNumber");

