import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' }
  ]
});

// Filter out harmless serverless pooler idle disconnects (e.g. Neon dropping idle sockets)
(prisma as any).$on('error', (e: any) => {
  const msg = typeof e === 'string' ? e : e?.message || '';
  if (msg.includes('kind: Closed') || msg.includes('kind: Io') || msg.includes('10054')) {
    return;
  }
  console.error('❌ Prisma Error:', msg);
});

(prisma as any).$on('warn', (e: any) => {
  const msg = typeof e === 'string' ? e : e?.message || '';
  console.warn('⚠️ Prisma Warning:', msg);
});
