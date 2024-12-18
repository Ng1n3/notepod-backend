import { booleanArg, intArg, list, nonNull, queryType, stringArg } from 'nexus';

import {
  NOT_AUTHENTICATED,
  NOT_FOUND,
  ROWS_LIMIT,
  UNKNOWN_SESSION,
} from '../constants';
import { Icursor, Mycontext } from '../interfaces';
// import { GetAllUsers } from './types/GetAllUsers';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticationError } from 'apollo-server-express';
import { NOTFOUND } from 'dns';
import { BaseError } from '../errors/BaseError';
import { ValidationError } from '../errors/ValidationError';
import { isAuthenticated } from '../util';
import { NoteType } from './types/NoteTypes';
import { PasswordType } from './types/PasswordTypes';
import { TodoType } from './types/TodoTypes';
import { UserType } from './types/UserTypes';

export const Query = queryType({
  definition(t) {
    t.field('hello', {
      type: 'String',
      resolve: () => 'Hello world',
    });
    t.field('getUsers', {
      type: list(UserType),
      args: {
        cursor: intArg(),
      },
      resolve: async (_, { cursor }: Icursor, context: Mycontext) => {
        try {
          if (!isAuthenticated(context))
            return new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });

          // const userId = context.session.userId;
          if (!context.session.userId)
            throw new AuthenticationError(UNKNOWN_SESSION);

          if (typeof cursor !== 'number' || cursor < 0) {
            throw new ValidationError('Cursor must be a non-negative integer');
          }

          const users = await context.prisma.user.findMany({
            take: ROWS_LIMIT,
            skip: cursor,
            select: {
              id: true,
              email: true,
              username: true,
              note: true,
            },
          });
          return users.map((user) => ({
            id: user.id,
            email: user.email,
            username: user.username,
            note: user.note,
          }));
        } catch (error: any) {
          console.error(error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.list.field('getNotes', {
      type: NoteType,
      args: {
        cursor: intArg(),
        isDeleted: booleanArg(),
      },
      resolve: async (
        _: unknown,
        { cursor, isDeleted }: Icursor,
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

          if (typeof cursor !== 'number' || cursor < 0) {
            throw new ValidationError('Cursor must be a non-negative integer');
          }

          const notes = await context.prisma.note.findMany({
            take: ROWS_LIMIT,
            skip: cursor,
            where: {
              isDeleted: isDeleted !== undefined ? isDeleted : undefined,
              userId: context.session.userId,
            },
            select: {
              id: true,
              title: true,
              body: true,
              isDeleted: true,
              updatedAt: true,
              deletedAt: true,
              user: true,
            },
          });
          // console.log("RAW notes from database", notes);

          return notes.map((note) => ({
            id: note.id,
            title: note.title,
            body: note.body,
            isDeleted: note.isDeleted,
            deletedAt: note.deletedAt,
            updatedAt:
              note.updatedAt instanceof Date
                ? note.updatedAt.toISOString()
                : note.updatedAt,
            user: note.user,
          }));
        } catch (error: any) {
          console.error(error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.list.field('getTodos', {
      type: TodoType,
      args: {
        cursor: intArg(),
        isDeleted: booleanArg(),
      },
      resolve: async (
        _: unknown,
        { cursor, isDeleted }: Icursor,
        context: Mycontext
      ) => {
        try {
          if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
          {
            if (!isAuthenticated(context))
              return new AuthenticationError(NOT_AUTHENTICATED, {
                userId: context.session?.id,
              });

            // const userId = context.session.userId;
            if (!context.session.userId)
              throw new AuthenticationError(UNKNOWN_SESSION);

            if (typeof cursor !== 'number' || cursor < 0) {
              throw new ValidationError(
                'Cursor must be a non-negative integer'
              );
            }
          }

          const todos = await context.prisma.todos.findMany({
            take: ROWS_LIMIT,
            skip: cursor,
            where: {
              isDeleted: isDeleted !== undefined ? isDeleted : undefined,
              userId: context.session.userId,
            },
            select: {
              id: true,
              title: true,
              body: true,
              priority: true,
              dueDate: true,
              isDeleted: true,
              deletedAt: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          });

          return todos.map((todo) => ({
            id: todo.id,
            title: todo.title,
            body: todo.body,
            isDeleted: todo.isDeleted,
            deletedAt: todo.deletedAt,
            dueDate: todo.dueDate,
            priority: todo.priority,
            user: todo.user,
          }));
        } catch (error: any) {
          console.error(error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.list.field('getPasswordFields', {
      type: PasswordType,
      args: {
        cursor: intArg(),
        isDeleted: booleanArg(),
      },
      resolve: async (
        _: unknown,
        { cursor, isDeleted }: Icursor,
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

          if (typeof cursor !== 'number' || cursor < 0) {
            throw new ValidationError('Cursor must be a non-negative integer');
          }

          const passwordFields = await context.prisma.password.findMany({
            take: ROWS_LIMIT,
            skip: cursor,
            where: {
              isDeleted: isDeleted !== undefined ? isDeleted : undefined,
              userId: context.session.userId,
            },
            select: {
              id: true,
              fieldname: true,
              email: true,
              username: true,
              password: true,
              isDeleted: true,
              deletedAt: true,
              user: true,
            },
          });

          return passwordFields.map((field) => ({
            id: field.id,
            fieldname: field.fieldname,
            email: field.email,
            username: field.username,
            password: field.password,
            isDeleted: field.isDeleted,
            deletedAt: field.deletedAt,
            user: field.user,
          }));
        } catch (error: any) {
          console.error(error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.field('getNote', {
      type: 'NoteType',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (
        _: unknown,
        { id }: { id: string },
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

          const note = await context.prisma.note.findUnique({
            where: { id },
            select: {
              id: true,
              title: true,
              body: true,
              isDeleted: true,
              updatedAt: true,
              deletedAt: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          });
          if (!note) {
            throw new BaseError(NOTFOUND, `Note with ID ${id} not found`);
          }
          return {
            ...note,
            updatedAt:
              note.updatedAt instanceof Date
                ? note.updatedAt.toISOString()
                : note.updatedAt,
          };
        } catch (error) {
          console.error('Error fetching note: ', error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.field('getTodo', {
      type: 'TodoType',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (
        _: unknown,
        { id }: { id: string },
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

          const todo = await context.prisma.todos.findUnique({
            where: { id },
            select: {
              id: true,
              title: true,
              body: true,
              priority: true,
              isDeleted: true,
              dueDate: true,
              deletedAt: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          });
          if (!todo) {
            throw new BaseError(NOTFOUND, `Todo with ID ${id} not found`);
          }
          return todo;
        } catch (error) {
          console.error('Error fetching todo: ', error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.field('getPasswordField', {
      type: 'PasswordType',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (
        _: unknown,
        { id }: { id: string },
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

          const password = await context.prisma.password.findUnique({
            where: { id },
            select: {
              id: true,
              username: true,
              fieldname: true,
              password: true,
              isDeleted: true,
              deletedAt: true,
              email: true,
              user: {
                select: {
                  email: true,
                  username: true,
                },
              },
            },
          });
          if (!password) {
            throw new BaseError(NOT_FOUND, `Password with ID ${id} not found`);
          }
          return password;
        } catch (error) {
          console.error('Error fetching Passwordfields: ', error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.field('currentUser', {
      type: 'UserType',
      resolve: async (_: unknown, __: unknown, context: Mycontext) => {
        try {
          if (!context.session.userId)
            throw new AuthenticationError(UNKNOWN_SESSION);

          const user = await context.prisma.user.findUnique({
            where: { id: context.session.userId },
            select: { id: true, email: true, username: true },
          });

          if (!user) {
            throw new BaseError(NOTFOUND, 'No user found for current session');
          }
          return user;
        } catch (error) {
          console.error('Login error:', error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.list.field('searchNote', {
      type: 'NoteType',
      args: {
        searchTerm: nonNull(stringArg()),
      },
      resolve: async (_: unknown, { searchTerm }, context: Mycontext) => {
        try {
          if (!isAuthenticated(context))
            return new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });

          // const userId = context.session.userId;
          if (!context.session.userId)
            throw new AuthenticationError(UNKNOWN_SESSION);

          const note = await context.prisma.note.findMany({
            where: {
              title: { contains: searchTerm, mode: 'insensitive' },
              userId: context.session.userId,
              // isDeleted: false
            },
          });

          if (!note) throw new BaseError(NOT_FOUND, 'No note found');
          return note;
        } catch (error) {
          console.error('search error:', error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });

    t.list.field('searchTodo', {
      type: 'TodoType',
      args: {
        searchTerm: nonNull(stringArg()),
      },
      resolve: async (_: unknown, { searchTerm }, context: Mycontext) => {
        try {
          if (!isAuthenticated(context))
            return new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });

          // const userId = context.session.userId;
          if (!context.session.userId)
            throw new AuthenticationError(UNKNOWN_SESSION);

          const todo = await context.prisma.todos.findMany({
            where: {
              title: { contains: searchTerm, mode: 'insensitive' },
              userId: context.session.userId,
              // isDeleted: false
            },
          });
          if (!todo) throw new BaseError(NOT_FOUND, 'Todo not found');
          return todo;
        } catch (error) {
          console.error('search error:', error);
          if (error instanceof BaseError) {
            throw error;
          } else if (error instanceof PrismaClientKnownRequestError) {
            throw new BaseError(
              'DatabaseError',
              'A database error occurred',
              500,
              true,
              { originalError: error.message }
            );
          } else {
            throw new BaseError(
              'UnknownError',
              'An unexpected error occurred',
              500,
              false,
              {
                originalError:
                  error instanceof Error ? error.message : String(error),
              }
            );
          }
        }
      },
    });
  },
});
