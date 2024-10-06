import { booleanArg, intArg, list, nonNull, queryType, stringArg } from 'nexus';

import {
  // NOT_AUTHENTICATED,
  ROWS_LIMIT,
} from '../constants';
import { Icursor, Mycontext } from '../interfaces';
// import { GetAllUsers } from './types/GetAllUsers';
// import { isAuthenticated } from '../util';
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
          // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

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
        } catch (error) {
          console.error(error);
          return false;
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
          // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
          const notes = await context.prisma.note.findMany({
            take: ROWS_LIMIT,
            skip: cursor,
            where: {
              isDeleted: isDeleted !== undefined ? isDeleted : undefined,
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
        } catch (error) {
          console.error(error);
          return false;
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
          // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
          const todos = await context.prisma.todos.findMany({
            take: ROWS_LIMIT,
            skip: cursor,
            where: {
              isDeleted: isDeleted !== undefined ? isDeleted : undefined,
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
        } catch (error) {
          console.error(error);
          return false;
        }
      },
    });
    t.list.field('getPasswordField', {
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
          // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
          const passwordFields = await context.prisma.password.findMany({
            take: ROWS_LIMIT,
            skip: cursor,
            where: {
              isDeleted: isDeleted !== undefined ? isDeleted : undefined,
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
        } catch (error) {
          console.error(error);
          return false;
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
            throw new Error(`Note with ID ${id} not found`);
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
          throw error;
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
            throw new Error(`Todo with ID ${id} not found`);
          }
          return todo;
        } catch (error) {
          console.error('Error fetching todo: ', error);
          throw error;
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
            throw new Error(`Password with ID ${id} not found`);
          }
          return password;
        } catch (error) {
          console.error('Error fetching Passwordfields: ', error);
          throw error;
        }
      },
    });
  },
});
