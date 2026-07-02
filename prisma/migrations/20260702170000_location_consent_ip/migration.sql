-- Track the IP at consent time so we only re-prompt when it changes.
ALTER TABLE "LocationConsent" ADD COLUMN "ipAddress" TEXT;
