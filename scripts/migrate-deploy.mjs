// Applies pending Prisma migrations during the build, using the direct (non-pooled)
// Neon connection. Skips gracefully when DIRECT_URL isn't configured so a deploy
// never fails just because migrations aren't wired for that environment yet.
import { execSync } from 'node:child_process';

if (!process.env.DIRECT_URL) {
  console.warn('[migrate-deploy] DIRECT_URL not set — skipping `prisma migrate deploy`.');
  process.exit(0);
}

try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (err) {
  console.error('[migrate-deploy] Migration failed:', err?.message ?? err);
  process.exit(1);
}
