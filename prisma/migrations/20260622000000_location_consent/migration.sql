-- CreateEnum
CREATE TYPE "LocationConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'DENIED');

-- AlterTable: precise GPS on AuthEvent (consented logins)
ALTER TABLE "AuthEvent" ADD COLUMN "gpsLatitude" DOUBLE PRECISION;
ALTER TABLE "AuthEvent" ADD COLUMN "gpsLongitude" DOUBLE PRECISION;
ALTER TABLE "AuthEvent" ADD COLUMN "gpsAccuracyM" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "LocationConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "status" "LocationConsentStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracyM" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocationConsent_userId_key" ON "LocationConsent"("userId");

-- CreateIndex
CREATE INDEX "LocationConsent_status_idx" ON "LocationConsent"("status");
