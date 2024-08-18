import { PrismaClient } from '@prisma/client';

export const getMyPrismaClient = async (): Promise<PrismaClient> => {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'info' },
      { emit: 'stdout', level: 'warn' },
    ],
  });
  return client;
};
