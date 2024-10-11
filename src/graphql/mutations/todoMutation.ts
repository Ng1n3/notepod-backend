import { Todos } from '@prisma/client';
import { booleanArg, stringArg } from 'nexus';
import {
  INVALID_CREDENTIALS,
  NOT_AUTHENTICATED,
  NOT_FOUND,
} from '../../constants';
import { Mycontext } from '../../interfaces';
import { isAuthenticated } from '../../util';
import { ZodNote, ZodTodo } from '../validator/schema';

const FIXED_USER_ID = '24992fef-d16c-4e63-be0b-b169cf9b93f9';

export const todoMutation = (t: any) => {
  t.field('createTodo', {
    type: 'TodoType',
    args: {
      title: stringArg(),
      body: stringArg(),
      priority: stringArg(),
      dueDate: stringArg(),
      isDeleted: booleanArg(),
      deletedAt: stringArg(),
    },
    resolve: async (
      _: unknown,
      {
        title,
        body,
        isDeleted,
        deletedAt,
        priority,
        dueDate,
      }: Pick<
        Todos,
        'body' | 'title' | 'priority' | 'dueDate' | 'isDeleted' | 'deletedAt'
      >,
      context: Mycontext
    ) => {
      try {
        // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

        const validation = ZodTodo.pick({
          title: true,
          body: true,
          userId: true,
          deletedAt: true,
          priority: true,
          dueDate: true,
          isDeleted: true,
        }).safeParse({
          title,
          body,
          userId: FIXED_USER_ID,
          isDeleted: isDeleted ?? false,
          dueDate: dueDate ? new Date(dueDate): undefined,
          priority: priority ?? 'LOW',
          deletedAt: deletedAt ? new Date(deletedAt) : null,
        });

        if (!validation.success){
          console.log("validation error: ", validation.error.issues);
          throw new Error(INVALID_CREDENTIALS)};

        // if (!context.session.userId)
        //   throw new Error('User Id is required to create a note');

        const todo = await context.prisma.todos.create({
          data: {
            title,
            body,
            priority,
            isDeleted: isDeleted,
            dueDate: dueDate ? new Date(dueDate): undefined,
            userId: FIXED_USER_ID,
          },
          select: {
            id: true,
            title: true,
            body: true,
            priority: true,
            isDeleted: true,
            dueDate: true,
            updatedAt: true,
            user: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        });
        console.log("backend todo", todo);
        return todo;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });
  t.field('updateTodo', {
    type: 'TodoType',
    args: {
      id: stringArg(),
      title: stringArg(),
      body: stringArg(),
      dueDate: stringArg(),
      isDeleted: booleanArg(),
      deletedAt: stringArg(),
      priority: stringArg(),
    },
    resolve: async (
      _: unknown,
      {
        id,
        title,
        body,
        isDeleted,
        deletedAt,
        dueDate,
        priority,
      }: Pick<
        Todos,
        | 'body'
        | 'deletedAt'
        | 'id'
        | 'title'
        | 'isDeleted'
        | 'priority'
        | 'dueDate'
      >,
      context: Mycontext
    ) => {
      try {
        // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

        const validation = ZodTodo.pick({
          title: true,
          body: true,
          isDeleted: true,
          deletedAt: true,
          dueDate: true,
          priority: true,
          // userId: true,
        }).safeParse({ title, body, isDeleted, deletedAt, priority });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }

        // if (!context.session.userId)
        //   throw new Error('User Id is required to create a note');

        const todo = await context.prisma.todos.findUnique({ where: { id } });
        if (!todo) return new Error(NOT_FOUND);

        const updatedTodo = await context.prisma.todos.update({
          where: { id },
          data: {
            title: title ?? todo.title,
            body: body ?? todo.body,
            dueDate: dueDate ?? todo.dueDate,
            deletedAt: deletedAt ?? todo.deletedAt,
            isDeleted: isDeleted ?? todo.isDeleted,
            priority: priority ?? todo.priority,
          },
          select: {
            id: true,
            title: true,
            body: true,
            isDeleted: true,
            deletedAt: true,
            dueDate: true,
            priority: true,
            user: {
              select: {
                email: true,
                username: true,
              }
            }
          }
        });
        return updatedTodo;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });
  t.boolean('deleteTodo', {
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Todos, 'id'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
        await context.prisma.todos.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  });
  t.field('restoreTodo', {
    type: 'TodoType',
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
      }: Pick<Todos, 'id' | 'isDeleted' | 'deletedAt'>,
      context: Mycontext
    ) => {
      try {
        // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
        const validation = ZodTodo.pick({
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({ isDeleted, deletedAt });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }

        const selectedTodo = await context.prisma.todos.findUnique({
          where: { id },
        });
        if (!selectedTodo) throw new Error(NOT_FOUND);
        if (selectedTodo.isDeleted === false && selectedTodo.deletedAt) return;
        const updatedTodo = await context.prisma.todos.update({
          where: { id },
          data: {
            isDeleted: false,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            body: true,
            priority: true,
            dueDate: true,
            isDeleted: true,
            updatedAt: true,
            user: {
              select: {
                email: true,
                username: true
              }
            }
          }
        });
        return updatedTodo;
      } catch (error) {
        console.error('error restoring note', error);
        throw error;
      }
    },
  });
};
