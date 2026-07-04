-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "fiscal_years" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "ledger_groups" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "ledgers" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "voucher_types" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "voucher_entries" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "acct_cost_centers" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "parties" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "acct_bank_accounts" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "Account_organizationId_idx" ON "Account"("organizationId");

-- CreateIndex
CREATE INDEX "fiscal_years_organizationId_idx" ON "fiscal_years"("organizationId");

-- CreateIndex
CREATE INDEX "ledger_groups_organizationId_idx" ON "ledger_groups"("organizationId");

-- CreateIndex
CREATE INDEX "ledgers_organizationId_idx" ON "ledgers"("organizationId");

-- CreateIndex
CREATE INDEX "voucher_types_organizationId_idx" ON "voucher_types"("organizationId");

-- CreateIndex
CREATE INDEX "vouchers_organizationId_idx" ON "vouchers"("organizationId");

-- CreateIndex
CREATE INDEX "voucher_entries_organizationId_idx" ON "voucher_entries"("organizationId");

-- CreateIndex
CREATE INDEX "acct_cost_centers_organizationId_idx" ON "acct_cost_centers"("organizationId");

-- CreateIndex
CREATE INDEX "parties_organizationId_idx" ON "parties"("organizationId");

-- CreateIndex
CREATE INDEX "items_organizationId_idx" ON "items"("organizationId");

-- CreateIndex
CREATE INDEX "acct_bank_accounts_organizationId_idx" ON "acct_bank_accounts"("organizationId");


-- Backfill: assign all existing accounting rows to the default org so the
-- current company's data remains visible once routes filter by organizationId.
-- (org_default was created in 20260702150000_multi_tenant_foundation.)
UPDATE "Account" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "fiscal_years" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "ledger_groups" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "ledgers" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "voucher_types" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "vouchers" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "voucher_entries" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "acct_cost_centers" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "parties" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "items" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "acct_bank_accounts" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
