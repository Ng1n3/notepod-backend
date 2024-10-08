import { Note } from '@prisma/client';
import { booleanArg, stringArg } from 'nexus';
import {
  INVALID_CREDENTIALS,
  // NOT_AUTHENTICATED,
  // NOT_AUTHORIZED,
  NOT_FOUND,
} from '../../constants';
import { Mycontext } from '../../interfaces';
// import { isAuthenticated } from '../../util';
import { ZodNote } from '../validator/schema';

const FIXED_USER_ID = '24992fef-d16c-4e63-be0b-b169cf9b93f9';
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
        // if (!isAuthenticated(context)) return new Error(NOT_AUTHORIZED);

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
        });

        if (!validation.success) throw new Error(INVALID_CREDENTIALS);

        // const userId = context.session.userId || 'temp-user-id';
        // if (!context.session.userId)
        //   throw new Error('User Id is required to create a note');

        const note = await context.prisma.note.create({
          data: {
            title,
            body,
            isDeleted: isDeleted ?? false,
            deletedAt: deletedAt ? new Date(deletedAt) : null,
            userId: FIXED_USER_ID,
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
      } catch (error) {
        console.error(error);
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
        // if (!isAuthenticated(context)) return new Error(NOT_AUTHORIZED);
        const validation = ZodNote.pick({
          title: true,
          body: true,
          isDeleted: true,
          deletedAt: true,
          userId: true,
        }).safeParse({ title, body, isDeleted, deletedAt });

        if (!validation.success) {
          validation.error.issues.map((issue) => {
            console.error(`Error in ${issue.path.join('.')}: ${issue.message}`);
          });
          throw new Error(INVALID_CREDENTIALS);
        }

        // if (!context.session.userId)
        //   throw new Error('User Id is required to create a note');

        const note = await context.prisma.note.findUnique({
          where: { id },
        });

        if (!note) return new Error(NOT_FOUND);

        const updatedNote = await context.prisma.note.update({
          where: { id },
          data: {
            title: title ?? note.title,
            body: body ?? note.body,
            deletedAt: deletedAt ?? note.deletedAt,
            isDeleted: isDeleted ?? note.isDeleted,
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
        // if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
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
};
