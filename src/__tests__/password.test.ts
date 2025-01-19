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

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.createPassword).toEqual(mockPassword);
      expect(mockCtx.prisma.password.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Password Query', () => {
    it('it should return all Passwords', async () => {
      const mockPasswords = [
        {
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
        },
        {
          id: '2',
          fieldname: 'Facebook',
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
        },
      ];

      mockCtx.prisma.password.findMany = jest
        .fn()
        .mockResolvedValue(mockPasswords);

      const res = await server.executeOperation(
        {
          query: `
        query GetPasssswords($isDeleted: Boolean!) {
          getPasswords(isDeleted: $isDeleted) {
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
            isDeleted: false,
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.getPasswords).toEqual(mockPasswords);
      expect(mockCtx.prisma.password.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(mockCtx.prisma.password.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('Password Query', () => {
    it('returns a single Password by id', async () => {
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

      mockCtx.prisma.password.findUnique = jest
        .fn()
        .mockResolvedValue(mockPassword);

      const res = await server.executeOperation(
        {
          query: `
          query GetPassword($id: ID!) {
          getPassword(id: $id) {
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
            id: mockPassword.id,
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.getPassword).toEqual(mockPassword);
      expect(mockCtx.prisma.password.findUnique).toHaveBeenCalledWith({
        where: { id: mockPassword.id },
      });
      expect(mockCtx.prisma.password.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  it('should return null for non-existent Password', async () => {
    mockCtx.prisma.todo.findUnique = jest.fn().mockResolvedValue(null);

    const res = await server.executeOperation(
      {
        query: `
      query GetPassword($id: ID!) {
        getPassword(id: $id) {
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
          id: 'non-existent-id',
        },
      },
      {
        contextValue: mockCtx,
      }
    );

    const result =
      res.body.kind === 'single' ? res.body.singleResult.data : null;

    expect(result?.getPassword).toBeNull();
    expect(mockCtx.prisma.password.findUnique).toHaveBeenCalledTimes(1);
    expect(mockCtx.prisma.password.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
    });
  });

  describe('update Password mutation', () => {
    it('should update a Password successfully', async () => {
      const mockupdatePassword = {
        id: '1',
        fieldname: 'Telegram',
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

      mockCtx.prisma.password.update = jest
        .fn()
        .mockResolvedValue(mockupdatePassword);

      const res = await server.executeOperation(
        {
          query: `
            mutation UpdatePassword($id: ID!, $fieldname: String, $email: String, $username: String, $password: String) {
              updatePassword(id: $id, fieldname: $fieldname, email: $email, username: $username, password: $password) {
                id
                fieldname
                email
                isDeleted
                deletedAt
                username
                password
                updatedAt
                user {
                  email
                  username
                }
              }
            }
          `,
          variables: {
            id: mockupdatePassword.id,
            fieldname: mockupdatePassword.fieldname,
            username: mockupdatePassword.username,
            password: mockupdatePassword.password,
            email: mockupdatePassword.email,
          },
        },
        {
          contextValue: mockCtx,
        }
      );


      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.updatePassword).toEqual(mockupdatePassword);
      expect(mockCtx.prisma.password.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          fieldname: 'Telegram',
          username: mockupdatePassword.username,
          password: mockupdatePassword.password,
          email: mockupdatePassword.email,
        },
      });
      expect(mockCtx.prisma.password.update).toHaveBeenCalledTimes(1);
    });
  });
});
