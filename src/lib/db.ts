import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across module evaluations. In development this
// survives HMR; in serverless (Vercel) it survives warm invocations. Without
// this, a new client — and a new connection pool — is created repeatedly and
// the database's connection limit is quickly exhausted.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;
