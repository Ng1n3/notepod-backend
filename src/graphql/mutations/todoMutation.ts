import { Todos } from '@prisma/client';
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
import { BaseError } from '../../errors/BaseError';
import { ConflictError } from '../../errors/ConflictError';
import { DatabaseError } from '../../errors/DatabaseError';
import { ValidationError } from '../../errors/ValidationError';
import { Mycontext } from '../../interfaces';
import { generateUniqueTitle, isAuthenticated } from '../../util';
import { ZodTodo } from '../validator/schema';
import { AuthenticationError } from '../../errors/AuthenticationError';

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
        // console.log('PING!!!');
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

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
          userId: context.session.userId,
          isDeleted: isDeleted ?? false,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority: priority ?? 'LOW',
          deletedAt: deletedAt ? new Date(deletedAt) : null,
        });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
        }

        const uniqueTitle = await generateUniqueTitle(
          context.prisma,
          title!,
          userId!,
          'todo'
        );

        const todo = await context.prisma.todos.create({
          data: {
            title: uniqueTitle,
            body,
            priority,
            isDeleted: isDeleted,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            userId: context.session.userId,
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
        // console.log('backend todo', todo);
        return todo;
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'p2002'
        ) {
          throw new ConflictError(ALREADY_TAKEN, {
            title,
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        // const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

        const validation = ZodTodo.pick({
          title: true,
          body: true,
          isDeleted: true,
          deletedAt: true,
          dueDate: true,
          priority: true,
          userId: true,
        }).safeParse({ title, body, isDeleted, deletedAt, priority });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
        }

        const todo = await context.prisma.todos.findUnique({ where: { id } });
        if (!todo)
          return new BaseError(NOT_FOUND, 'Todo not found', 404, true, { id });

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
              },
            },
          },
        });
        return updatedTodo;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });

  t.field('deleteTodo', {
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Todos, 'id'>,
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

        const todo = await context.prisma.todos.findUnique({ where: { id } });

        if (!todo)
          return new BaseError(NOT_FOUND, 'Todo not found', 404, true, { id });

        await context.prisma.todos.delete({
          where: { id },
        });
        return todo;
      } catch (error) {
        console.error(error);
        throw error;
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        // const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

        const validation = ZodTodo.pick({
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({ isDeleted, deletedAt });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
        }

        const selectedTodo = await context.prisma.todos.findUnique({
          where: { id },
        });
        if (!selectedTodo)
          throw new BaseError(NOT_FOUND, 'Todo not found', 404, true, { id });

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
            deletedAt: true,
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
        return updatedTodo;
      } catch (error) {
        console.error('error restoring note', error);
        throw error;
      }
    },
  });

  t.field('softDeleteTodo', {
    type: 'TodoType',
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Todos, 'id'>,
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

        const selectedTodo = await context.prisma.todos.findUnique({
          where: { id },
        });

        if (!selectedTodo)
          throw new BaseError(NOT_FOUND, 'Todo not found', 404, true, { id });

        if (selectedTodo.isDeleted && selectedTodo.deletedAt)
          return selectedTodo;

        const updatedTodos = await context.prisma.todos.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
          select: {
            id: true,
            title: true,
            body: true,
            priority: true,
            dueDate: true,
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
        return updatedTodos;
      } catch (error) {
        console.error('error restoring note', error);
        throw error;
      }
    },
  });
};
