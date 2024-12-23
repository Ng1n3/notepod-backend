import { Password } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { booleanArg, stringArg } from 'nexus';
import {
  INVALID_CREDENTIALS,
  NOT_AUTHENTICATED,
  NOT_FOUND,
  UNKNOWN_SESSION,
} from '../../constants';
import { AuthenticationError } from '../../errors/AuthenticationError';
import { BaseError } from '../../errors/BaseError';
import { ValidationError } from '../../errors/ValidationError';
import { Mycontext } from '../../interfaces';
import { generateUniqueTitle, isAuthenticated } from '../../util';
import { logError, logger } from '../../winston';
import { PasswordType } from '../types/PasswordTypes';
import { ZodPassword } from '../validator/schema';

// const FIXED_USER_ID = '24992fef-d16c-4e63-be0b-b169cf9b93f9';

export const passwordMutation = (t: any) => {
  t.field('createPassword', {
    type: PasswordType,
    args: {
      fieldname: stringArg(),
      email: stringArg(),
      password: stringArg(),
      username: stringArg(),
    },
    resolve: async (
      _: unknown,
      {
        fieldname,
        email,
        password,
        username,
        isDeleted,
        deletedAt,
      }: Pick<
        Password,
        | 'fieldname'
        | 'email'
        | 'password'
        | 'username'
        | 'deletedAt'
        | 'isDeleted'
      >,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('createPassword', error, context);
          return error;
        }
        const userId = context.session.userId;

        if (!userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('createPassword', error, context);
          return error;
        }

        const validation = ZodPassword.pick({
          fieldname: true,
          email: true,
          username: true,
          password: true,
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({
          fieldname,
          email,
          password,
          username,
          isDeleted,
          userId: context.session.userId,
          deletedAt: deletedAt ? new Date(deletedAt).toISOString() : null,
        });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          const error = new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
          logError('createPassword', error, context);
          return error;
        }

        const uniqueFieldName = await generateUniqueTitle(
          context.prisma,
          fieldname!,
          userId!,
          'todo'
        );

        const passwordField = await context.prisma.password.create({
          data: {
            email,
            fieldname: uniqueFieldName,
            password,
            username,
            isDeleted: isDeleted ?? false,
            deletedAt: deletedAt ? new Date(deletedAt) : null,
            userId: context.session.userId!,
          },
          select: {
            id: true,
            fieldname: true,
            password: true,
            email: true,
            username: true,
            isDeleted: true,
            deletedAt: true,
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        });

        logger.info('Todo created successfully', {
          resolver: 'createPassword',
          id: passwordField.id,
          title: passwordField.fieldname,
        });

        return passwordField;
      } catch (error: any) {
        logError('createPassword', error, context);
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

  t.field('updatePassword', {
    type: PasswordType,
    args: {
      id: stringArg(),
      fieldname: stringArg(),
      email: stringArg(),
      username: stringArg(),
      password: stringArg(),
      isDeleted: booleanArg(),
      deletedAt: stringArg(),
    },
    resolve: async (
      _: unknown,
      {
        id,
        fieldname,
        email,
        password,
        username,
        isDeleted,
        deletedAt,
      }: Pick<
        Password,
        | 'fieldname'
        | 'email'
        | 'password'
        | 'isDeleted'
        | 'deletedAt'
        | 'id'
        | 'username'
      >,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('updatePassword', error, context);
          return error;
        }
        const userId = context.session.userId;

        if (!userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('updatePassword', error, context);
          return error;
        }

        const validation = ZodPassword.pick({
          fieldname: true,
          email: true,
          password: true,
          username: true,
          isDeleted: true,
          deletedAt: true,
        }).safeParse({
          fieldname,
          username,
          email,
          password,
          isDeleted,
          deletedAt,
        });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          const error = new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
          logError('updatePassword', error, context);
          return error;
        }

        const passwordField = await context.prisma.password.findUnique({
          where: { id },
        });

        if (!passwordField) {
          const error = new BaseError(
            NOT_FOUND,
            'Password not found',
            404,
            true,
            {
              id,
            }
          );
          logError('updatePassword', error, context);
          return error;
        }

        const updatedPasswordField = await context.prisma.password.update({
          where: { id },
          data: {
            fieldname: fieldname ?? passwordField.fieldname,
            email: email ?? passwordField.email,
            username: username ?? passwordField.username,
            password: password ?? passwordField.password,
            isDeleted: isDeleted ?? passwordField.isDeleted,
            deletedAt: deletedAt ?? passwordField.deletedAt,
          },
          select: {
            id: true,
            email: true,
            fieldname: true,
            password: true,
            username: true,
            isDeleted: true,
            deletedAt: true,
            user: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        });

        logger.info('Password fields updated successfully', {
          resolver: 'updatePassword',
          id: updatedPasswordField.id,
          passwordField: updatedPasswordField.fieldname,
        });
        return updatedPasswordField;
      } catch (error: any) {
        logError('updatedPassword', error, context);
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

  t.field('deletedPassword', {
    type: PasswordType,
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Password, 'id'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('deletedPassword', error, context);
          return error;
        }

        const userId = context.session.userId;
        if (!userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('deletedPassword', error, context);
          return error;
        }

        const passwordField = await context.prisma.password.findUnique({
          where: { id },
        });

        if (!passwordField) {
          const error = new BaseError(
            NOT_FOUND,
            'Password field not found',
            404,
            true,
            { id }
          );
          logError('deletedPassword', error, context);
          return error;
        }

        await context.prisma.password.delete({
          where: { id },
        });

        logger.info('Password deleted successfully', {
          resolver: 'deletedPassword',
          id: passwordField.id,
          passwordField: passwordField.fieldname,
        });
        return passwordField;
      } catch (error: any) {
        logError('deletedPassword', error, context);
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

  t.field('restorePassword', {
    type: PasswordType,
    args: {
      id: stringArg(),
      isDeleted: booleanArg(),
      deletedAt: stringArg(),
    },
    resolve: async (
      _: unknown,
      {
        id,
        deletedAt,
        isDeleted,
      }: Pick<Password, 'id' | 'isDeleted' | 'deletedAt'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('deleteTodo', error, context);
          return error;
        }

        const userId = context.session.userId;
        if (!userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('deleteTodo', error, context);
          return error;
        }

        const validation = ZodPassword.pick({
          isDeleted: true,
          deletedAt: true,
        }).safeParse({ isDeleted, deletedAt });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          const error = new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
          logError('restorePassword', error, context);
          return error;
        }

        const selectedPassword = await context.prisma.password.findUnique({
          where: { id },
        });

        if (!selectedPassword) {
          const error = new BaseError(
            NOT_FOUND,
            'Selected Password field not found',
            404,
            true,
            { id }
          );
          logError('restorePassword', error, context);
          return error;
        }

        if (selectedPassword.isDeleted === false && selectedPassword.deletedAt)
          return;

        const updatedPassword = await context.prisma.password.update({
          where: { id },
          data: {
            isDeleted: false,
            deletedAt: null,
          },
          select: {
            id: true,
            fieldname: true,
            email: true,
            userId: true,
            password: true,
            isDeleted: true,
            updatedAt: true,
            user: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        });

        logger.info('Password restored successfully', {
          resolver: 'restorePassword',
          id: updatedPassword.id,
          passwordField: updatedPassword.fieldname,
        });
        return updatedPassword;
      } catch (error: any) {
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

  t.field('softDeletePassword', {
    type: PasswordType,
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Password, 'id'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('softDeletePassword', error, context);
          return error;
        }

        const userId = context.session.userId;
        if (!userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('softDeletePassword', error, context);
          return error;
        }

        const selectedPassword = await context.prisma.password.findUnique({
          where: { id },
        });

        if (!selectedPassword) {
          const error = new BaseError(
            NOT_FOUND,
            'Selected Password not found',
            404,
            true,
            { id }
          );
          logError('softDeletePassword', error, context);
          return error;
        }

        if (selectedPassword.isDeleted && selectedPassword.deletedAt)
          return selectedPassword;
        const updatedPassword = await context.prisma.password.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
          select: {
            id: true,
            fieldname: true,
            email: true,
            username: true,
            password: true,
            isDeleted: true,
            deletedAt: true,
            updatedAt: true,
            user: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        });

        logger.info('Password soft deleted successfully', {
          resolver: 'softDeletePassword',
          id: updatedPassword.id,
          passwordField: updatedPassword.fieldname,
        });
        return updatedPassword;
      } catch (error: any) {
        logError('softDeletePassword', error, context);
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
};
