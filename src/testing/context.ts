import { PrismaClient } from '@prisma/client';

export type MockContext = {
  prisma: PrismaClient;
  session: {
    userId: string;
    id: string;
    cookie: string;
    regenerate: () => void;
    destroy: () => void;
  };
};

export function createMockContext(): MockContext {
  return {
    prisma: new PrismaClient(),
    session: {
      userId: 'test-user-id',
      id: 'test-session-id',
      cookie: 'test-cookie',
      regenerate: () => {},
      destroy: () => {},
    },
  };
}
