export type MockContext = {
  req: Record<string, any>; // Simple mock for Request
  res: Record<string, any>; // Simple mock for Response
  prisma: {
    note: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      softDeleteNote: jest.Mock;
    };
    todo: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      softDeleteTodo: jest.Mock;
    }
    $disconnect: jest.Mock;
  };
  session: {
    userId: string;
    id: string;
    cookie: Record<string, any>;
    regenerate: jest.Mock;
    destroy: jest.Mock;
    reload: jest.Mock;
    resetMaxAge: jest.Mock;
    save: jest.Mock;
    touch: jest.Mock;
  };
  redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };
};

export function createMockContext(): MockContext {
  return {
    req: {},
    res: {},
    prisma: {
      note: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        softDeleteNote: jest.fn(),
      },
      todo: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        softDeleteTodo: jest.fn(),
      },
      $disconnect: jest.fn().mockResolvedValue(undefined),
    },
    session: {
      userId: 'test-user-id',
      id: 'test-session-id',
      cookie: {},
      regenerate: jest.fn((cb) => cb(null)),
      destroy: jest.fn((cb) => cb(null)),
      reload: jest.fn((cb) => cb(null)),
      resetMaxAge: jest.fn(),
      save: jest.fn((cb) => cb(null)),
      touch: jest.fn(),
    },
    redis: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    },
  };
}
