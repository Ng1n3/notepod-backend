import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Mycontext } from '../interfaces';
import { createMockContext, MockContext } from '../testing/context';

describe('Password Operations', () => {
  let server: ApolloServer;
  let mockCtx: MockContext;

  beforeEach(async () => {
    mockCtx = createMockContext();

    server = new ApolloServer({
      schema: makeExecutableSchema({
        typeDefs: `
          type PasswordType {
            id: ID!
            fieldname: String!
            email: String
            username: String
            password: String!
            isDeleted: Boolean!
            deletedAt: String
            updatedAt: String
            user: UserType!
          }

          type UserType {
            email: String!
            username: String!
          }

          type Query {
            getPasswords(isDeleted: Boolean!): [PasswordType!]!
            getPassword(id: ID!): PasswordType
          }

          type Mutation {
            createPassword(
              fieldname: String!
              password: String!
              email: String
              username: String
              deletedAt: String
              isDeleted: Boolean
            ): PasswordType
            updatePassword(id: ID!, fieldname: String, username: String, email: String, password: String): PasswordType
            softDeletePassword(id: ID!): PasswordType
            deletePassword(id: ID!): PasswordType
            restorePassword(id: ID!): PasswordType
        }
        `,
        resolvers: {
          Mutation: {
            createPassword: async (_parent, args, _: Mycontext) => {
              return mockCtx.prisma.password.create({ data: args });
            },
            updatePassword: async (_parent, { id, ...data }, _: Mycontext) => {
              return mockCtx.prisma.password.update({ where: { id }, data });
            },
            softDeletePassword: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.password.update({
                where: { id },
                data: {
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                },
              });
            },
            deletePassword: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.password.delete({ where: { id } });
            },
            restorePassword: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.password.update({
                where: { id },
                data: { isDeleted: false, deletedAt: null },
              });
            },
          },
          Query: {
            getPasswords: async (_parent, { isDeleted }, _: Mycontext) => {
              return mockCtx.prisma.password.findMany({
                where: { isDeleted },
              });
            },
            getPassword: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.password.findUnique({
                where: { id },
              });
            },
          },
        },
      }),
    });

    await server.start();
  });

  afterEach(async () => {
    await server.stop();
    await mockCtx.prisma.$disconnect();
  });

  describe('create Password', () => {
    it('Should create a new password successfully', async () => {
      const mockPassword = {
        id: '1',
        fieldname: 'Twitter',
        email: 'test@example.com',
        username: 'test1235',
        password: 'test1234',
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date().toISOString(),
        user: {
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockCtx.prisma.password.create = jest
        .fn()
        .mockResolvedValue(mockPassword);

      const res = await server.executeOperation(
        {
          query: `
        mutation CreatePassword($fieldname: String!, $password: String!, $email: String,  $username: String) {
          createPassword(fieldname: $fieldname, password: $password, email: $email, username: $username) {
            id
            fieldname
            password
            isDeleted
            username
            email
            deletedAt
            updatedAt
            user {
              email
              username
                }
          }
        }
      `,
          variables: {
            fieldname: mockPassword.fieldname,
            username: mockPassword.username,
            password: mockPassword.password,
            email: mockPassword.email,
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result = res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.createPassword).toEqual(mockPassword)
      expect(mockCtx.prisma.password.create).toHaveBeenCalledTimes(1)
    });
  });
});
