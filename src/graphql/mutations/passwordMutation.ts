import { Password } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { booleanArg, stringArg } from 'nexus';
import {
  ALREADY_TAKEN,
  DATABASE_ERROR,
  INVALID_CREDENTIALS,
  NOT_AUTHENTICATED,
  NOT_FOUND,
  UNKNOWN_SESSION,
} from '../../constants';
import { AuthenticationError } from '../../errors/AuthenticationError';
import { BaseError } from '../../errors/BaseError';
import { ConflictError } from '../../errors/ConflictError';
import { DatabaseError } from '../../errors/DatabaseError';
import { ValidationError } from '../../errors/ValidationError';
import { Mycontext } from '../../interfaces';
import { generateUniqueTitle, isAuthenticated } from '../../util';
import { ZodPassword } from '../validator/schema';

// const FIXED_USER_ID = '24992fef-d16c-4e63-be0b-b169cf9b93f9';

export const passwordMutation = (t: any) => {
  t.field('createPassword', {
    type: 'PasswordType',
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

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
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
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
            userId: context.session.userId,
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
        // console.log('backend passwordField: ', passwordField);
        return passwordField;
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'p2002'
        ) {
          throw new ConflictError(ALREADY_TAKEN, {
            fieldname,
            userId: context.session.userId,
          }); // Handle unique constraint violation
        }

        if (error instanceof BaseError) throw error;

        throw new DatabaseError(DATABASE_ERROR, {
          originalError: error instanceof Error ? error.message : String(error),
        });
      }
    },
  });

  t.field('updatePassword', {
    type: 'PasswordType',
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        // const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

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
          throw new Error(INVALID_CREDENTIALS);
        }

        const passwordField = await context.prisma.password.findUnique({
          where: { id },
        });

        if (!passwordField)
          throw new BaseError(NOT_FOUND, 'Password not found', 404, true, {
            id,
          });

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
        return updatedPasswordField;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });

  t.field('deletedPassword', {
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Password, 'id'>,
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

        const passwordField = await context.prisma.password.findUnique({
          where: { id },
        });

        if (!passwordField)
          return new BaseError(
            NOT_FOUND,
            'Password field not found',
            404,
            true,
            { id }
          );

        await context.prisma.password.delete({
          where: { id },
        });
        return passwordField;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });
  t.field('restorePassword', {
    type: 'PasswordType',
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        // const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

        const validation = ZodPassword.pick({
          isDeleted: true,
          deletedAt: true,
        }).safeParse({ isDeleted, deletedAt });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
        }

        const selectedPassword = await context.prisma.password.findUnique({
          where: { id },
        });
        if (!selectedPassword)
          throw new BaseError(
            NOT_FOUND,
            'Selected Password field not found',
            404,
            true,
            { id }
          );

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
        return updatedPassword;
      } catch (error) {
        console.error('error restoring note', error);
        throw error;
      }
    },
  });
  t.field('softDeletePassword', {
    type: 'PasswordType',
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Password, 'id'>,
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

        const selectedPassword = await context.prisma.password.findUnique({
          where: { id },
        });

        if (!selectedPassword)
          throw new BaseError(
            NOT_FOUND,
            'Selected Password not found',
            404,
            true,
            { id }
          );

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
        return updatedPassword;
      } catch (error) {
        console.error('error restoring note', error);
        throw error;
      }
    },
  });
};
