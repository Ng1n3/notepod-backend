import { PrismaClient } from '@prisma/client';
import '@testing-library/jest-dom';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup any test database connections or global test setup
});

afterAll(async () => {
  await prisma.$disconnect();
});
