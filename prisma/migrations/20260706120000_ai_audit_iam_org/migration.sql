-- Add organizationId to previously-unscoped models (AuthEvent, AuditLog, AI*, IAMRole)
-- plus backfill to the single existing org. Nullable scalar + index (no FK), matching
-- the existing tenant-column convention.

ALTER TABLE "AuthEvent" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AIPrediction" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AIChatSession" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AISentimentAnalysis" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AIResumeAnalysis" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AISkillGap" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AIAnomaly" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AIInsight" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AINLQuery" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AILearningRecommendation" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AIMentorMatch" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "AIAutomationRule" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "IAMRole" ADD COLUMN "organizationId" TEXT;

CREATE INDEX "AuthEvent_organizationId_idx" ON "AuthEvent"("organizationId");
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AIPrediction_organizationId_idx" ON "AIPrediction"("organizationId");
CREATE INDEX "AIChatSession_organizationId_idx" ON "AIChatSession"("organizationId");
CREATE INDEX "AISentimentAnalysis_organizationId_idx" ON "AISentimentAnalysis"("organizationId");
CREATE INDEX "AIResumeAnalysis_organizationId_idx" ON "AIResumeAnalysis"("organizationId");
CREATE INDEX "AISkillGap_organizationId_idx" ON "AISkillGap"("organizationId");
CREATE INDEX "AIAnomaly_organizationId_idx" ON "AIAnomaly"("organizationId");
CREATE INDEX "AIInsight_organizationId_idx" ON "AIInsight"("organizationId");
CREATE INDEX "AINLQuery_organizationId_idx" ON "AINLQuery"("organizationId");
CREATE INDEX "AILearningRecommendation_organizationId_idx" ON "AILearningRecommendation"("organizationId");
CREATE INDEX "AIMentorMatch_organizationId_idx" ON "AIMentorMatch"("organizationId");
CREATE INDEX "AIAutomationRule_organizationId_idx" ON "AIAutomationRule"("organizationId");
CREATE INDEX "IAMRole_organizationId_idx" ON "IAMRole"("organizationId");

UPDATE "AuthEvent" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AuditLog" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AIPrediction" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AIChatSession" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AISentimentAnalysis" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AIResumeAnalysis" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AISkillGap" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AIAnomaly" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AIInsight" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AINLQuery" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AILearningRecommendation" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AIMentorMatch" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
UPDATE "AIAutomationRule" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;
-- IAMRole: system roles (ADMIN/MANAGER/EMPLOYEE) stay global (NULL); only
-- custom roles are stamped to the existing org.
UPDATE "IAMRole" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL AND "isSystem" = false;

-- Swap IAMRole name uniqueness from global to per-org.
DROP INDEX IF EXISTS "IAMRole_name_key";
CREATE UNIQUE INDEX "IAMRole_organizationId_name_key" ON "IAMRole"("organizationId", "name");
