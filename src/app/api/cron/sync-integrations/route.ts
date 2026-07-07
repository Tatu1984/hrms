import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { IntegrationSyncService } from '@/lib/integrations/sync-service';
import { logger } from '@/lib/logger';

/**
 * Scheduled auto-sync for integration connections (Vercel cron).
 *
 * System job — intentionally cross-org, gated by CRON_SECRET (not a user
 * session). Syncs every ACTIVE connection that has sync enabled and is not set
 * to MANUAL. MANUAL connections are only synced via the authenticated
 * POST /api/integrations/sync route.
 *
 * Note: Vercel Hobby crons run at daily granularity, so syncFrequency values
 * finer than daily (HOURLY, etc.) still only fire once per scheduled run here;
 * a paid plan or external scheduler is needed for true sub-daily cadence.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connections = await prisma.integrationConnection.findMany({
    where: {
      isActive: true,
      syncEnabled: true,
      syncFrequency: { not: 'MANUAL' },
    },
    select: { id: true, name: true, platform: true, organizationId: true },
  });

  logger.info('cron.sync-integrations.start', { count: connections.length });

  let succeeded = 0;
  let failed = 0;
  const results: Array<{ id: string; platform: string; ok: boolean; error?: string }> = [];

  for (const conn of connections) {
    try {
      await IntegrationSyncService.syncConnection(conn.id, {
        syncWorkItems: true,
        syncCommits: true,
      });
      succeeded++;
      results.push({ id: conn.id, platform: conn.platform, ok: true });
    } catch (err) {
      failed++;
      const error = err instanceof Error ? err.message : String(err);
      // One bad connection must not abort the rest of the sweep.
      logger.error('cron.sync-integrations.connection-failed', {
        connectionId: conn.id,
        platform: conn.platform,
        organizationId: conn.organizationId,
        error,
      });
      results.push({ id: conn.id, platform: conn.platform, ok: false, error });
    }
  }

  logger.info('cron.sync-integrations.done', { total: connections.length, succeeded, failed });

  return NextResponse.json({ success: true, total: connections.length, succeeded, failed, results });
}
