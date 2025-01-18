import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Mycontext } from '../interfaces';
import { createMockContext, MockContext } from '../testing/context';

describe('Todo Operation', () => {
  let server: ApolloServer;
  let mockCtx: MockContext;

  beforeEach(async () => {
    mockCtx = createMockContext();

    server = new ApolloServer({
      schema: makeExecutableSchema({
        typeDefs: `
          type TodoType {
            id: ID!
            title: String!
            body: String!
            priority: String!
            isDeleted: Boolean!
            dueDate: String
            deletedAt: String
            updatedAt: String
            user: UserType!
          }

          type UserType {
            email: String!
            username: String!
          }

          type Query {
            getTodos(isDeleted: Boolean!): [TodoType!]!
            getTodo(id: ID!): TodoType
          }

          type Mutation {
            createTodo(
              title: String!
              body: String!
              priority: String!
              dueDate: String!
              deletedAt: String
              isDeleted: Boolean
            ): TodoType
            updateTodo(id: ID!, title: String, body: String): TodoType
            softDeleteTodo(id: ID!): TodoType
            deleteTodo(id: ID!): TodoType
            restoreTodo(id: ID!): TodoType
      }
        `,
        resolvers: {
          Mutation: {
            createTodo: async (_parent, args, _: Mycontext) => {
              return mockCtx.prisma.todo.create({ data: args });
            },
            updateTodo: async (_parent, { id, ...data }, _: Mycontext) => {
              return mockCtx.prisma.todo.update({ where: { id }, data });
            },
            softDeleteTodo: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.todo.update({
                where: { id },
                data: {
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                },
              });
            },
            restoreTodo: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.todo.update({
                where: { id },
                data: { isDeleted: false, deletedAt: null },
              });
            },
          },
          Query: {
            getTodos: async (_parent, { isDeleted }, _: Mycontext) => {
              return mockCtx.prisma.todo.findMany({
                where: { isDeleted },
              });
            },
            getTodo: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.todo.findUnique({
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

  describe('create Todo', () => {
    it('should create a new Todo successfully', async () => {
      const mockTodo = {
        id: '1',
        title: 'This is a test Todo',
        body: 'This is a test todo for the body',
        priority: 'LOW',
        dueDate: new Date().toISOString(),
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date().toISOString(),
        user: {
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockCtx.prisma.todo.create = jest.fn().mockResolvedValue(mockTodo);

      const res = await server.executeOperation(
        {
          query: `
          mutation createTodo($title: String!, $body: String!, $priority: String!,  $dueDate: String!) {
            createTodo(title: $title, body: $body, priority: $priority, dueDate: $dueDate) {
              id
              title
              body
              isDeleted
              dueDate
              priority
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
            title: mockTodo.title,
            body: mockTodo.body,
            priority: mockTodo.priority,
            dueDate: mockTodo.dueDate
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.createTodo).toEqual(mockTodo);
      expect(mockCtx.prisma.todo.create).toHaveBeenCalledTimes(1);
    });
  });
});
