import { Password } from '@prisma/client';
import { stringArg } from 'nexus';
import {
  INVALID_CREDENTIALS,
  NOT_AUTHENTICATED,
  NOT_FOUND,
} from '../../constants';
import { Mycontext } from '../../interfaces';
import { isAuthenticated } from '../../util';
import { ZodPassword } from '../validator/schema';

const FIXED_USER_ID = '24992fef-d16c-4e63-be0b-b169cf9b93f9';

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
        // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
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
          userId: FIXED_USER_ID,
          deletedAt: deletedAt ? new Date(deletedAt).toISOString() : null,
        });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }

        // if (!context.session.userId)
        //   throw new Error(
        //     'User Id is required to create a password field in notepod.xyz'
        //   );

        const passwordField = await context.prisma.password.create({
          data: {
            email,
            fieldname,
            password,
            username,
            isDeleted: isDeleted ?? false,
            deletedAt: deletedAt ? new Date(deletedAt) : null,
            // userId: context.session.userId,
            userId: FIXED_USER_ID,
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
        console.log('backend passwordField: ', passwordField);
        return passwordField;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  });
  t.boolean('updatePassword', {
    args: {
      id: stringArg(),
      fieldname: stringArg(),
      email: stringArg(),
      username: stringArg(),
      password: stringArg(),
      isDeleted: stringArg(),
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
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
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

        if (!context.session.userId)
          throw new Error('User Id is required to create a password field');

        const passwordField = await context.prisma.password.findUnique({
          where: { id },
        });

        if (!passwordField) throw new Error(NOT_FOUND);

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
        });
        return !!updatedPasswordField;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  });
  t.boolean('deletedPassword', {
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Password, 'id'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
        await context.prisma.password.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  });
};
