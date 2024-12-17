import { Note } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { booleanArg, stringArg } from 'nexus';
import {
  ALREADY_TAKEN,
  INVALID_CREDENTIALS,
  NOT_AUTHENTICATED,
  NOT_AUTHORIZED,
  NOT_FOUND,
} from '../../constants';
import { Mycontext } from '../../interfaces';
import { generateUniqueTitle, isAuthenticated } from '../../util';
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
        if (!isAuthenticated(context))
          return new GraphQLError(NOT_AUTHORIZED, {
            extensions: { code: NOT_AUTHORIZED },
          });

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

        if (!validation.success) throw new Error(INVALID_CREDENTIALS);

        const userId = context.session.userId;
        if (!context.session.userId)
          throw new Error('User Id is required to create a note');

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

        // console.log('backend note', note);
        return note;
      } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
          throw new Error(ALREADY_TAKEN); // Handle unique constraint violation
        }
        throw error;
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
        if (!isAuthenticated(context)) return new Error(NOT_AUTHORIZED);
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
          throw new Error(INVALID_CREDENTIALS);
        }

        if (!context.session.userId)
          throw new Error('User Id is required to create a note');

        const note = await context.prisma.note.findUnique({
          where: { id },
        });

        if (!note) return new Error(NOT_FOUND);

        const userId = context.session.userId;

        const updatedNote = await context.prisma.note.update({
          where: { id },
          data: {
            title: title ?? note.title,
            body: body ?? note.body,
            deletedAt: deletedAt ?? note.deletedAt,
            isDeleted: isDeleted ?? note.isDeleted,
            userId,
          },
          // select: {
          //   id: true,
          //   title: true,
          //   body: true,
          //   isDeleted: true,
          //   deletedAt: true,
          //   user: {
          //     select: {
          //       id: true,
          //       email: true,
          //       username: true,
          //     },
          // },
          // },
        });

        console.log('updated backend note', updatedNote);

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
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
        const note = await context.prisma.note.delete({
          where: {
            id,
          },
        });
        if (!note) throw new Error(NOT_FOUND);
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
        console.log('hi we got here');
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
        const validation = ZodNote.pick({
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({ isDeleted, deletedAt, userId: context.session.userId });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }

        const selectedNote = await context.prisma.note.findUnique({
          where: { id },
        });
        if (!selectedNote) throw new Error(NOT_FOUND);
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
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

        const selectedNote = await context.prisma.note.findUnique({
          where: { id },
        });
        if (!selectedNote) throw new Error(NOT_FOUND);
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
