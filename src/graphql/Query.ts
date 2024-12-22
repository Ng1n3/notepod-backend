import { booleanArg, intArg, nonNull, queryType, stringArg } from 'nexus';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { error } from 'console';
import {
  NOT_AUTHENTICATED,
  NOT_FOUND,
  ROWS_LIMIT,
  UNKNOWN_SESSION,
} from '../constants';
import { AuthenticationError } from '../errors/AuthenticationError';
import { BaseError } from '../errors/BaseError';
import { ValidationError } from '../errors/ValidationError';
import { Icursor, Mycontext } from '../interfaces';
import { isAuthenticated } from '../util';
import { logError, logger } from '../winston';
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
    t.list.field('getUsers', {
      type: UserType,
      args: {
        cursor: intArg({ default: 0 }),
        isDeleted: booleanArg(),
      },
      resolve: async (
        _: unknown,
        { cursor = 0 }: Icursor,
        context: Mycontext
      ) => {
        try {
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('getUsers', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('getUsers', error, context);
            return error;
          }

          if (typeof cursor !== 'number' || cursor < 0) {
            const error = new ValidationError(
              'Cursor must be a non-negative integer'
            );
            logError('getUsers', error, context);
            return error;
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

          logger.info('Successfully fetched Users', {
            resolver: 'getUsers',
            count: users.length,
            cursor,
          });

          return users.map((user) => ({
            id: user.id,
            email: user.email,
            username: user.username,
            note: user.note,
          }));
        } catch (error: any) {
          logError('getUsers', error, context);
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
        cursor: intArg({ default: 0 }),
        isDeleted: booleanArg(),
      },
      resolve: async (
        _: unknown,
        { cursor, isDeleted }: Icursor,
        context: Mycontext
      ) => {
        try {
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('getNotes', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('getNotes', error, context);
            return error;
          }

          if (typeof cursor !== 'number' || cursor < 0) {
            const error = new ValidationError(
              'Cursor must be a non-negative integer'
            );
            logError('getNotes', error, context);
            return error;
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

          logger.info('Successfully fetched Notes', {
            resolver: 'getNotes',
            count: notes.length,
            cursor,
          });

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
        cursor: intArg({ default: 0 }),
        isDeleted: booleanArg(),
      },
      resolve: async (
        _: unknown,
        { cursor, isDeleted }: Icursor,
        context: Mycontext
      ) => {
        try {
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('getTodos', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('getTodos', error, context);
            return error;
          }

          if (typeof cursor !== 'number' || cursor < 0) {
            const error = new ValidationError(
              'Cursor must be a non-negative integer'
            );
            logError('getTodos', error, context);
            return error;
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

          logger.info('Successfully fetched Todos', {
            resolver: 'getTodos',
            count: todos.length,
            cursor,
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
        cursor: intArg({default: 0}),
        isDeleted: booleanArg(),
      },
      resolve: async (
        _: unknown,
        { cursor, isDeleted }: Icursor,
        context: Mycontext
      ) => {
        try {
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('getPasswordFields', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('getPasswordFields', error, context);
            return error;
          }

          if (typeof cursor !== 'number' || cursor < 0) {
            const error = new ValidationError(
              'Cursor must be a non-negative integer'
            );
            logError('getPasswordFields', error, context);
            return error;
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

          logger.info('Successfully fetched PasswordFields', {
            resolver: 'getPasswordFields',
            count: passwordFields.length,
            cursor,
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
      type: NoteType,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (
        _: unknown,
        { id }: { id: string },
        context: Mycontext
      ) => {
        try {
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('getNote', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('getNote', error, context);
            return error;
          }

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
            const error = new BaseError(
              NOT_FOUND,
              `Note with ID ${id} not found`
            );
            logError('getNote', error, context);
            return error;
          }

          logger.info('Successfully fetched Note', {
            resolver: 'getNote',
            noteId: note.id,
          });

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
      type: TodoType,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (
        _: unknown,
        { id }: { id: string },
        context: Mycontext
      ) => {
        try {
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('getTodo', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('getTodo', error, context);
            return error;
          }

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
            const error = new BaseError(
              NOT_FOUND,
              `Todo with ID ${id} not found`
            );
            logError('getTodo', error, context);
            return error;
          }
          logger.info('Successfully fetched Todo', {
            resolver: 'getTodo',
            todoId: todo.id,
          });

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
      type: PasswordType,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (
        _: unknown,
        { id }: { id: string },
        context: Mycontext
      ) => {
        try {
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('getPasswordField', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('getPasswordField', error, context);
            return error;
          }

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
            const error = new BaseError(
              NOT_FOUND,
              `Password with ID ${id} not 
              found`
            );
            logError('getPasswordField', error, context);
            return error;
          }

          logger.info('Successfully fetched PasswordField', {
            resolver: 'getPasswordField',
            passwordId: password.id,
          });

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
      type: UserType,
      resolve: async (_: unknown, __: unknown, context: Mycontext) => {
        try {
          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('currentUser', error, context);
            return error;
          }

          const user = await context.prisma.user.findUnique({
            where: { id: context.session.userId },
            select: { id: true, email: true, username: true },
          });

          if (!user) {
            const eror = new BaseError(
              NOT_FOUND,
              'No user found for current session'
            );
            logError('currentUser', eror, context);
            return error;
          }

          logger.info('Successfully fetched current user', {
            resolver: 'currentUser',
            userId: user.id,
          });
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
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('serachNote', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('serachNote', error, context);
            return error;
          }

          const note = await context.prisma.note.findMany({
            where: {
              title: { contains: searchTerm, mode: 'insensitive' },
              userId: context.session.userId,
              // isDeleted: false
            },
          });

          if (note.length === 0) {
            const note = new BaseError(NOT_FOUND, 'No note found');
            logError('searchNote', note, context);
            return note;
          }

          logger.info('Successfully fetched Note', {
            resolver: 'searchNote',
            noteId: note.length,
          });

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
      type: TodoType,
      args: {
        searchTerm: nonNull(stringArg()),
      },
      resolve: async (_: unknown, { searchTerm }, context: Mycontext) => {
        try {
          if (!isAuthenticated(context)) {
            const error = new AuthenticationError(NOT_AUTHENTICATED, {
              userId: context.session?.id,
            });
            logError('searchTodo', error, context);
            return error;
          }

          if (!context.session.userId) {
            const error = new AuthenticationError(UNKNOWN_SESSION);
            logError('searchTodo', error, context);
            return error;
          }

          const todo = await context.prisma.todos.findMany({
            where: {
              title: { contains: searchTerm, mode: 'insensitive' },
              userId: context.session.userId,
              // isDeleted: false
            },
          });

          if (todo.length === 0) {
            const error = new BaseError(NOT_FOUND, 'Todo not found');
            logError('searchTodo', error, context);
            return error;
          }

          logger.info('Successfully fetched Todo', {
            resolver: 'searchTodo',
            todoId: todo.length,
          });

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
