-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "voucherId" TEXT;

-- CreateIndex
CREATE INDEX "Account_voucherId_idx" ON "Account"("voucherId");

