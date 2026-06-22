-- CreateTable
CREATE TABLE "TrustedLoginLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "ipAddress" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "asn" TEXT,
    "isp" TEXT,
    "label" TEXT,
    "approvedBy" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedLoginLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrustedLoginLocation_userId_idx" ON "TrustedLoginLocation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedLoginLocation_userId_ipAddress_key" ON "TrustedLoginLocation"("userId", "ipAddress");
