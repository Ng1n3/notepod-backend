import { PrismaClient } from '@prisma/client';
import argon from 'argon2';
import { GraphQLDateTime } from 'graphql-iso-date';
import { asNexusMethod } from 'nexus';
import { MAX_TITLE_ATTEMPT } from './constants';
import { Mycontext } from './interfaces';

export const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = await argon.hash(password);
  return hashedPassword;
};

export const verifyPassword = async (
  inputPassword: string,
  dbPassword: string
): Promise<boolean> => {
  const isCorrect = await argon.verify(dbPassword, inputPassword);
  return isCorrect;
};

export const isProd = () => process.env.NODE_ENV === 'production';

export const isAuthenticated = (context: Mycontext): boolean => {
  const { session } = context;
  //  console.log("session userID",session.userId);
  return !!session.userId;
  // if (context.session.userId) return true;
  // return false;
};

export async function generateUniqueTitle(
  prisma: PrismaClient,
  originalTitle: string,
  userId: string,
  type: 'note' | 'password' | 'todo'
): Promise<string> {
  let uniqueTitle = originalTitle;
  const max_attempt = MAX_TITLE_ATTEMPT;

  for (let counter = 0; counter < max_attempt; counter++) {
    let existingItem;

    switch (type) {
      case 'note':
        existingItem = await prisma.note.findFirst({
          where: {
            title: uniqueTitle,
            userId,
          },
        });
        break;
      case 'password':
        existingItem = await prisma.password.findFirst({
          where: {
            fieldname: uniqueTitle,
            userId,
          },
        });
        break;
      case 'todo':
        existingItem = await prisma.todos.findFirst({
          where: {
            title: uniqueTitle,
            userId,
          },
        });
        break;
    }

    if (!existingItem) return uniqueTitle;

    // Generate new unique title
    uniqueTitle = `${originalTitle}_${counter + 1}`;
  }

  throw new Error(
    `Unable to generate unique ${type} title after ${max_attempt} attempts`
  );
}

export const DateTime = asNexusMethod(GraphQLDateTime as any, 'dateTime');
