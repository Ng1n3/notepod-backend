import { Todos } from '@prisma/client';
import { stringArg } from 'nexus';
import {
  INVALID_CREDENTIALS,
  NOT_AUTHENTICATED,
  NOT_FOUND,
} from '../../constants';
import { Mycontext } from '../../interfaces';
import { isAuthenticated } from '../../util';
import { ZodNote, ZodTodo } from '../validator/schema';

export const todoMutation = (t: any) => {
  t.boolean('createTodo', {
    args: {
      title: stringArg(),
      body: stringArg(),
    },
    resolve: async (
      _: unknown,
      { title, body }: Pick<Todos, 'body' | 'title'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

        const validation = ZodNote.pick({
          title: true,
          body: true,
        }).safeParse({ title, body });

        if (!validation.success) throw new Error(INVALID_CREDENTIALS);

        if (!context.session.userId)
          throw new Error('User Id is required to create a note');

        const todo = await context.prisma.todos.create({
          data: { title, body, userId: context.session.userId },
          select: { id: true },
        });

        return !!todo;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  });
  t.boolean('updateTodo', {
    args: {
      id: stringArg(),
      title: stringArg(),
      body: stringArg(),
      isDeleted: stringArg(),
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
        'body' | 'deletedAt' | 'id' | 'title' | 'isDeleted' | 'priority' | 'dueDate'
      >,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

        const validation = ZodTodo.pick({
          title: true,
          body: true,
          isDeleted: true,
          deletedAt: true,
          duedate: true,
          priority: true,
        }).safeParse({ title, body, isDeleted, deletedAt, priority });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }

        if (!context.session.userId)
          throw new Error('User Id is required to create a note');

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
        });
        return !!updatedTodo;
      } catch (error) {
        console.error(error);
        return false;
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
};
