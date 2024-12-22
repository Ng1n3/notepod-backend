import { User } from '@prisma/client';
import { stringArg } from 'nexus';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  INVALID_CREDENTIALS,
  NOT_AUTHENTICATED,
  NOT_FOUND,
  UNKNOWN_SESSION,
} from '../../constants';
import { AuthenticationError } from '../../errors/AuthenticationError';
import { BaseError } from '../../errors/BaseError';
import { ConflictError } from '../../errors/ConflictError';
import { ValidationError } from '../../errors/ValidationError';
import { Mycontext } from '../../interfaces';
import { hashPassword, isAuthenticated, verifyPassword } from '../../util';
import { logError, logger } from '../../winston';
import { ZodUpdateUser, ZodUser } from '../validator/schema';
import { UserType } from '../types/UserTypes';

export const userMutation = (t: any) => {
  t.field('createUser', {
    type: UserType,
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
        // if (isAuthenticated(context)) return new Error(NOT_AUTHORIZED);

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
          const firstIssue = validation.error.issues[0];
          let error;
          switch (firstIssue.path[0]) {
            case 'email':
              error = new ValidationError('INVALID_EMAIL');
              logError('createUser', error, context);
              return error;
            case 'password':
              error = new ValidationError('WEAK_PASSWORD');
              logError('createUser', error, context);
              return error;
            case 'username':
              error = new ValidationError('INVALID_USERNAME');
              logError('createUser', error, context);
              return error;
            default:
              error = new ValidationError('INVALID_INPUT');
              logError('createUser', error, context);
              return error;
          }
        }

        const existingUser = await context.prisma.user.findFirst({
          where: {
            OR: [
              { email: email.toLowerCase() },
              { username: username.toLowerCase() },
            ],
          },
        });

        if (existingUser) {
          if (existingUser.email === email.toLowerCase()) {
            const error = new ConflictError('EMAIL_EXISTS');
            logError('createUser', error, context);
            return error;
          }
          if (existingUser.username === username.toLowerCase()) {
            const error = new ConflictError('USERNAME_EXISTS');
            logError('createUser', error, context);
            return error;
          }
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await context.prisma.user.create({
          data: { username, email, password: hashedPassword },
          select: { id: true, username: true, email: true },
        });

        context.session.userId = newUser.id;
        logger.info('User created successfully', {
          userId: newUser.id,
          email: newUser.email,
        });
        return newUser;
      } catch (error: any) {
        console.error(error);
        logError('createUser', error, context);
        if (error instanceof BaseError) {
          throw error; // Re-throw the specific error
        } else if (error instanceof PrismaClientKnownRequestError) {
          throw new BaseError('DATABASE_ERROR', error.message, 500, true, {
            originalError: error.message,
          });
        } else {
          throw new BaseError(
            'UNKNOWN_ERROR',
            'An unexpected error occurred',
            500,
            false,
            { originalError: error.message }
          );
        }
      }
    },
  });

  t.field('loginUser', {
    type: UserType,
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

        const validation = ZodUser.pick({
          email: true,
          password: true,
        }).safeParse({
          email,
          password,
        });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.log(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
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

        // console.log("user from backend", user);
        if (!user) throw new BaseError(NOT_FOUND, 'user not found', 404, true);

        const isCorrect = await verifyPassword(password, user.password);
        console.log('Is corect:', isCorrect);
        if (!isCorrect) return new AuthenticationError(INVALID_CREDENTIALS);

        context.session['userId'] = user.id;
        // console.log("Session after login", context.session);
        context.session.save();
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } catch (error) {
        throw error;
      }
    },
  });

  t.field('deleteUser', {
    type: 'UserType',
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { ...userDetail }: Pick<User, 'id'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        // const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

        const user = await context.prisma.user.delete({
          where: {
            id: userDetail.id,
          },
        });
        if (!user) throw new BaseError(NOT_FOUND, 'user not found', 404, true);
        return user;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });

  t.field('logoutUser', {
    type: 'UserType',
    args: {},
    resolve: async (_: unknown, __: unknown, context: Mycontext) => {
      try {
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

        return new Promise((resolve, reject) => {
          context.session.destroy((err) => {
            if (err) {
              console.error('Error destroying session:', err);
              reject(
                new BaseError(
                  'SessionError',
                  'Failed to log out the user',
                  500,
                  true,
                  {
                    originalError: err.message,
                  }
                )
              );
            } else {
              resolve({ message: 'User logged out successfully' });
            }
          });
        });
      } catch (error: any) {
        console.error('Error loggin gout', error);
        throw error instanceof BaseError
          ? error
          : new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError: error.message,
              }
            );
      }
    },
  });

  t.field('updateUser', {
    type: 'UserType',
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        // const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

        const validation = ZodUpdateUser.pick({
          password: true,
        }).safeParse({ password });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
        }
        const existingUser = await context.prisma.user.findUnique({
          where: { id },
        });
        if (!existingUser) {
          throw new BaseError('NotFoundError', 'User not found', 404, true, {
            userId: id,
          });
        }

        const hashedPassword = await hashPassword(password);

        // Update the user
        const updatedUser = await context.prisma.user.update({
          where: { id },
          data: { password: hashedPassword },
          select: {
            id: true,
            email: true,
            username: true,
            updatedAt: true,
          },
        });

        return {
          message: 'User updated successfully',
          user: updatedUser,
        };
      } catch (error: any) {
        console.error(error);
        throw error instanceof BaseError
          ? error
          : new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError: error.message,
              }
            );
      }
    },
  });
};
