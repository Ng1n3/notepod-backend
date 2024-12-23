import { Note } from '@prisma/client';
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
import { ZodNote } from '../validator/schema';

export const noteMutation = (t: any) => {
  t.field('createNote', {
    type: 'NoteType',
    args: {
      title: stringArg(),
      body: stringArg(),
      deletedAt: stringArg(),
      isDeleted: booleanArg(),
    },
    resolve: async (
      _: unknown,
      {
        title,
        body,
        deletedAt,
        isDeleted,
      }: Pick<Note, 'body' | 'isDeleted' | 'title' | 'deletedAt'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('createNote', error, context);
          return error;
        }

        const userId = context.session.userId;
        if (!context.session.userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('createNote', error, context);
          return error;
        }

        const validation = ZodNote.pick({
          title: true,
          body: true,
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({
          title,
          body,
          isDeleted,
          deletedAt: deletedAt ? new Date(deletedAt).toISOString() : null,
          userId: context.session.userId,
        });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          const error = new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
          logError('createNote', error, context);
          return error;
        }

        const uniqueTitle = await generateUniqueTitle(
          context.prisma,
          title!,
          userId!,
          'note'
        );
        const note = await context.prisma.note.create({
          data: {
            title: uniqueTitle,
            body,
            isDeleted: isDeleted ?? false,
            deletedAt: deletedAt ? new Date(deletedAt) : null,
            // userId: FIXED_USER_ID,
            userId: userId as string,
          },
          select: {
            id: true,
            title: true,
            body: true,
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

        logger.info(`Note created successfully`, {
          resolver: 'createNote',
          id: note.id,
          title: note.title,
        });

        return note;
      } catch (error: any) {
        logError('createNote', error, context);
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

  t.field('updateNote', {
    type: 'NoteType',
    args: {
      id: stringArg(),
      title: stringArg(),
      body: stringArg(),
      deletedAt: stringArg(),
      isDeleted: booleanArg(),
    },
    resolve: async (
      _: unknown,
      {
        id,
        title,
        body,
        deletedAt,
        isDeleted,
      }: Pick<Note, 'id' | 'title' | 'body' | 'deletedAt' | 'isDeleted'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('updateNote', error, context);
          return error;
        }

        const userId = context.session.userId;
        if (!userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('updateNote', error, context);
          return error;
        }

        const validation = ZodNote.pick({
          title: true,
          body: true,
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({
          title,
          body,
          isDeleted,
          deletedAt,
          userId: context.session.userId,
        });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          const error = new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
          logError('updateNote', error, context);
          return error;
        }

        const note = await context.prisma.note.findUnique({
          where: { id },
        });

        if (!note) {
          const error = new BaseError(NOT_FOUND, 'Note not found', 404, true, {
            id,
          });
          logError('updateNote', error, context);
          return error;
        }

        const updatedNote = await context.prisma.note.update({
          where: { id },
          data: {
            title: title ?? note.title,
            body: body ?? note.body,
            deletedAt: deletedAt ?? note.deletedAt,
            isDeleted: isDeleted ?? note.isDeleted,
            userId,
          },
        });

        logger.info(`Note updated successfully`, {
          resolver: 'updateNote',
          id: updatedNote.id,
          title: updatedNote.title,
        });

        return updatedNote;
      } catch (error: any) {
        logError('updatedTodo', error, context);
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

  t.field('deleteNote', {
    type: 'NoteType',
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Note, 'id'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('deleteNote', error, context);
          return error;
        }

        const userId = context.session.userId;
        if (!userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('deleteNote', error, context);
          return error;
        }

        const note = await context.prisma.note.findUnique({
          where: { id },
        });

        if (!note) {
          const error = new BaseError(NOT_FOUND, 'Note not found', 404, true, {
            id,
          });
          logError('deleteNote', error, context);
          return error;
        }

        await context.prisma.note.delete({
          where: {
            id,
          },
        });

        logger.info(`Note deleted successfully`, {
          resolver: 'deleteNote',
          id: note.id,
          title: note.title,
        });

        return note;
      } catch (error: any) {
        logError('deleteTodo', error, context);
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

  t.field('restoreNote', {
    type: 'NoteType',
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
      }: Pick<Note, 'id' | 'isDeleted' | 'deletedAt'>,
      context: Mycontext
    ) => {
      try {
        if (!isAuthenticated(context)) {
          const error = new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });
          logError('restoreNote', error, context);
          return error;
        }

        const userId = context.session.userId;
        if (!userId) {
          const error = new AuthenticationError(UNKNOWN_SESSION);
          logError('restoreNote', error, context);
          return error;
        }
        const validation = ZodNote.pick({
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({ isDeleted, deletedAt, userId: context.session.userId });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          const error = new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
          logError('updateTodo', error, context);
          return error;
        }

        const selectedNote = await context.prisma.note.findUnique({
          where: { id },
        });
        if (!selectedNote) {
          const error = new BaseError(NOT_FOUND, 'Note not found', 404, true, {
            id,
          });
          logError('restoreNote', error, context);
          return error;
        }

        if (selectedNote.isDeleted === false && selectedNote.deletedAt) return;
        const updatedNote = await context.prisma.note.update({
          where: { id },
          data: {
            isDeleted: false,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            body: true,
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

        logger.info(`Note restored successfully`, {
          resolver: 'restoreNote',
          id: updatedNote.id,
          title: updatedNote.title,
        });
        return updatedNote;
      } catch (error:any) {
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

  t.field('softDeleteNote', {
    type: 'NoteType',
    args: {
      id: stringArg(),
    },
    resolve: async (
      _: unknown,
      { id }: Pick<Note, 'id'>,
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

        const selectedNote = await context.prisma.note.findUnique({
          where: { id },
        });
        if (!selectedNote)
          return new BaseError(NOT_FOUND, 'Note not found', 404, true, { id });

        if (selectedNote.isDeleted && selectedNote.deletedAt)
          return selectedNote;

        const updatedNote = await context.prisma.note.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
          select: {
            id: true,
            title: true,
            body: true,
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
        return updatedNote;
      } catch (error) {
        console.error('error restoring note', error);
        throw error;
      }
    },
  });
};
