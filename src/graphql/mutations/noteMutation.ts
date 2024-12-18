import { Note } from '@prisma/client';
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
import { ZodNote } from '../validator/schema';
import { AuthenticationError } from '../../errors/AuthenticationError';

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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

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
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
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

        return note;
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

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
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
        }

        const note = await context.prisma.note.findUnique({
          where: { id },
        });

        if (!note)
          return new BaseError(NOT_FOUND, 'Note not found', 404, true, { id });

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

        return updatedNote;
      } catch (error) {
        console.error(error);
        throw error;
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        // const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);

        const note = await context.prisma.note.findUnique({
          where: { id },
        });

        if (!note)
          return new BaseError(NOT_FOUND, 'Note not found', 404, true, { id });

        await context.prisma.note.delete({
          where: {
            id,
          },
        });

        return note;
      } catch (error) {
        console.error('error loggin out', error);
        throw error;
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
        if (!isAuthenticated(context))
          return new AuthenticationError(NOT_AUTHENTICATED, {
            userId: context.session?.id,
          });

        // const userId = context.session.userId;
        if (!context.session.userId)
          throw new AuthenticationError(UNKNOWN_SESSION);
        const validation = ZodNote.pick({
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({ isDeleted, deletedAt, userId: context.session.userId });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new ValidationError(INVALID_CREDENTIALS, {
            validationErrors: validation.error.errors,
          });
        }

        const selectedNote = await context.prisma.note.findUnique({
          where: { id },
        });
        if (!selectedNote)
          return new BaseError(NOT_FOUND, 'Note not found', 404, true, { id });

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
        return updatedNote;
      } catch (error) {
        console.error('error restoring note', error);
        throw error;
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
