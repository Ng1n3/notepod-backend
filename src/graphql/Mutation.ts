import { mutationType, stringArg } from 'nexus';
import { Mycontext } from '../interfaces';
import { hashPassword } from '../util';

export const Mutation = mutationType({
  definition(t) {
    t.boolean('createUser', {
      args: {
        username: stringArg(),
        email: stringArg(),
        password: stringArg(),
      },
      resolve: async (
        _,
        { username, email, password },
        { prisma }: Mycontext
      ) => {
        try {
          const hashedPassword = await hashPassword(password);
          await prisma.user.create({
            data: { username, email,  password: hashedPassword },
          });
          return true;
        } catch (error) {
          console.error(error);
          return new Error("There is an error");
        }
      },
    });
  },
});
