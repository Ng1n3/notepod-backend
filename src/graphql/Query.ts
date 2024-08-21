import { intArg, list, queryType } from 'nexus';
import { NOT_AUTHENTICATED, ROWS_LIMIT } from '../constants';
import { Icursor, Mycontext } from '../interfaces';
// import { GetAllUsers } from './types/GetAllUsers';
import { isAuthenticated } from '../util';
import { NoteType } from './types/NoteTypes';
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
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);

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
            note: user.note
          }));
          
        } catch (error) {
          console.error(error);
          return false
        }
      },
    });
    t.list.field('getNotes', {
      type: NoteType,
      args: {
        cursor: intArg()
      },
      resolve: async(_:unknown, {cursor}: Icursor, context: Mycontext) => {
        try {
        if (!isAuthenticated(context)) return new Error(NOT_AUTHENTICATED);
        const notes = await context.prisma.note.findMany({
          take: ROWS_LIMIT,
          skip: cursor,
          select: {
            id: true,
            title: true,
            body: true,
            isDeleted: true,
            deletedAt: true
          }
        })

        return notes.map(note => ({
          id: note.id,
          title: note.title,
          body: note.body,
          isDeleted: note.isDeleted,
          deletedAt: note.deletedAt
        }))
          
        } catch (error) {
          console.error(error);
          return false
        }
      }
    })
  },
});