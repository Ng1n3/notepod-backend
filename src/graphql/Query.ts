import { list, queryType } from 'nexus';
import { Mycontext } from '../interfaces';
import { GetAllUsers } from './types/GetAllUsers';

export const Query = queryType({
  definition(t) {
    t.field('hello', {
      type: 'String',
      resolve: () => 'Hello world',
    });
    t.field('getUsers', {
      type: list(GetAllUsers),
      resolve: async (_, __, { prisma }: Mycontext) => {
        const users = await prisma.user.findMany({
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
