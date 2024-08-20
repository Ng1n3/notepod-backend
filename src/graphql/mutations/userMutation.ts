import { User } from '@prisma/client';
import { mutationType, stringArg } from 'nexus';

import { INVALID_CREDENTIALS, NOT_FOUND } from '../../constants';
import { Mycontext } from '../../interfaces';
import { hashPassword } from '../../util';
import { ZodUpdateUser, ZodUser } from '../validator/schema';

export const userMutation = (t: any) => {
    t.boolean('createUser', {
      args: {
        username: stringArg(),
        email: stringArg(),
        password: stringArg(),
      },
      resolve: async (
        _,
        {
          username,
          password,
          email,
        }: Pick<User, 'username' | 'password' | 'email'>,
        { prisma }: Mycontext
      ) => {
        try {
          const validation = ZodUser.pick({
            username: true,
            email: true,
            password: true,
          }).safeParse({
            username,
            email,
            password,
          });

          if (!validation.success) {
            validation.error.issues.forEach((issue) => {
              console.error(
                `Error in ${issue.path.join('.')}: ${issue.message}`
              );
            });
            throw new Error(INVALID_CREDENTIALS);
          }

          const hashedPassword = await hashPassword(password);
          await prisma.user.create({
            data: { username, email, password: hashedPassword },
          });
          return true;
        } catch (error) {
          console.error(error);
          return new Error('There is an error');
        }
      },
    });
    t.boolean('loginUser', {
      args: {
        username: stringArg(),
        password: stringArg(),
      },
      resolve: async (
        _,
        { username, password }: Pick<User, 'username' | 'password'>,
        { prisma }: Mycontext
      ) => {
        try {
          const validation = ZodUser.pick({
            username: true,
            password: true,
          }).safeParse({
            username,
            password,
          });

          if (!validation.success) {
            validation.error.issues.forEach((issue) => {
              console.error(
                `Error in ${issue.path.join('.')}: ${issue.message}`
              );
            });
            throw new Error(INVALID_CREDENTIALS);
          }

          const user = await prisma.user.findUnique({
            where: {
              username: username,
            },
          });
          if (!user) throw new Error(INVALID_CREDENTIALS);
          return true;
        } catch (error) {
          console.error(error);
          return false;
        }
      },
    });
    t.boolean('deleteUser', {
      args: {
        id: stringArg(),
      },
      resolve: async (
        _,
        { ...userDetail }: Pick<User, 'id'>,
        { prisma }: Mycontext
      ) => {
        try {
          const user = await prisma.user.delete({
            where: {
              id: userDetail.id,
            },
          });
          if (!user) throw new Error(NOT_FOUND);
          return true;
        } catch (error) {
          console.error(error);
          return false;
        }
      },
    });
    t.boolean('updateUser', {
      args: {
        id: stringArg(),
        password: stringArg(),
      },
      resolve: async (_, { id, password }, { prisma }: Mycontext) => {
        try {
          const validation = ZodUpdateUser.pick({
            password: true,
          }).safeParse({ password });

          if (!validation.success) {
            validation.error.issues.map((issue) => {
              console.error(
                `Error in ${issue.path.join('.')}: ${issue.message}`
              );
            });
            throw new Error(INVALID_CREDENTIALS);
          }
          await prisma.user.update({
            where: {
              id,
            },
            data: {
              password,
            },
          });
          return true;
        } catch (error) {
          console.error(error);
          return false;
        }
      },
    });
  },
})