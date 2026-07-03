-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;


-- Bootstrap: grant super-admin to the platform owner so the console works out of the box.
UPDATE "User" SET "isSuperAdmin" = true WHERE "email" = 'sudipto.mitra@infinititechpartners.com';
