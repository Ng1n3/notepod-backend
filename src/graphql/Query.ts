import { intArg, list, queryType } from 'nexus';
import { ROWS_LIMIT } from '../constants';
import { Icursor, Mycontext } from '../interfaces';
import { GetAllUsers } from './types/GetAllUsers';

export const Query = queryType({
  definition(t) {
    t.field('hello', {
      type: 'String',
      resolve: () => 'Hello world',
    });
    t.field('getUsers', {
      type: list(GetAllUsers),
      args: {
        cursor: intArg(),
      },
      resolve: async (_, { cursor }: Icursor, { prisma }: Mycontext) => {
        const users = await prisma.user.findMany({
          take: ROWS_LIMIT,
          skip: cursor,
          select: {
            id: true,
            email: true,
            username: true,
          },
        });
        return users.map((user) => ({
          id: user.id,
          email: user.email,
          username: user.username,
        }));
      },
    });
  },
});