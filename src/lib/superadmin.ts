import { prisma } from '@/lib/db';
import type { JWTPayload } from '@/lib/jwt';

/**
 * Platform super-admin check. The flag lives on the User row (not the JWT), so
 * we look it up fresh — this is a rarely-hit console path, so the extra query is
 * fine and it can't be spoofed by an old token.
 */
export async function isSuperAdmin(
  session: Pick<JWTPayload, 'userId'> | null | undefined,
): Promise<boolean> {
  if (!session?.userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isSuperAdmin: true },
  });
  return !!user?.isSuperAdmin;
}
