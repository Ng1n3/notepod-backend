import { User } from '@prisma/client';
import { stringArg } from 'nexus';

import {
  INVALID_CREDENTIALS,
  NOT_AUTHENTICATED,
  NOT_AUTHORIZED,
  NOT_FOUND,
} from '../../constants';
import { Mycontext } from '../../interfaces';
import { hashPassword, isAuthenticated, verifyPassword } from '../../util';
import { ZodUpdateUser, ZodUser } from '../validator/schema';

export const userMutation = (t: any) => {
  t.field('createUser', {
    args: {
      username: stringArg(),
      email: stringArg(),
      password: stringArg(),
    },
    resolve: async (
      _: unknown,
      {
        username,
        password,
        email,
      }: Pick<User, 'username' | 'password' | 'email'>,
      context: Mycontext
    ) => {
      try {
        if (isAuthenticated(context)) return new Error(NOT_AUTHORIZED);

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
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await context.prisma.user.create({
          data: { username, email, password: hashedPassword },
          select: { id: true, username: true, email: true },
        });

        context.session.userId = newUser.id;
        // session['userId'] = user.id;
        return newUser;
      } catch (error) {
        console.error(error);
        return new Error('There is an error');
      }
    },
  });
  t.field('loginUser', {
    args: {
      email: stringArg(),
      password: stringArg(),
    },
    resolve: async (
      _: unknown,
      { email, password }: Pick<User, 'email' | 'password'>,
      context: Mycontext
    ) => {
      try {
        if (isAuthenticated(context)) return new Error(NOT_AUTHORIZED);

        const validation = ZodUser.pick({
          email: true,
          password: true,
        }).safeParse({
          email,
          password,
        });

        if (!validation.success) {
          validation.error.issues.forEach((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }

        const user = await context.prisma.user.findUnique({
          where: {
            email: email.toLowerCase(),
          },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
          },
        });
        if (!user) throw new Error(INVALID_CREDENTIALS);

        const isCorrect = await verifyPassword(password, user.password);
        if (!isCorrect) return new Error(INVALID_CREDENTIALS);

        context.session['userId'] = user.id;
        const { password:_, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
          throw new Error(error.message);
        }
        throw new Error('An unexpected error occurred during login');
      }
    },
  });
  t.boolean('deleteUser', {
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { ...userDetail }: Pick<User, 'id'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

        const user = await context.prisma.user.delete({
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
  t.boolean('logoutUser', {
    args: {},
    resolve: async (_: unknown, __: unknown, context: Mycontext) => {
      try {
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
        context.session.destroy((err) => {
          console.error('Error destroying Session', err);
        });
        return true;
      } catch (error) {
        console.error('Error loggin gout', error);
        return false;
      }
    },
  });

  t.boolean('updateUser', {
    args: {
      id: stringArg(),
      password: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id, password }: Pick<User, 'id' | 'password'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

        const validation = ZodUpdateUser.pick({
          password: true,
        }).safeParse({ password });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }
        await context.prisma.user.update({
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
};
