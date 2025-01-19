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
            updateTodo(id: ID!, title: String, body: String, priority: String): TodoType
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
            deleteTodo: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.todo.delete({ where: { id } });
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
            dueDate: mockTodo.dueDate,
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

  describe('Todo Query', () => {
    it('it should return all todos', async () => {
      const mockTodos = [
        {
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
        },
        {
          id: '2',
          title: 'This is a test Todo 2',
          body: 'This is a test todo for the body 2',
          priority: 'HIGH',
          dueDate: new Date().toISOString(),
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date().toISOString(),
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        },
      ];

      mockCtx.prisma.todo.findMany = jest.fn().mockResolvedValue(mockTodos);

      const res = await server.executeOperation(
        {
          query: `
        query GetTodos($isDeleted: Boolean!) {
          getTodos(isDeleted: $isDeleted) {
            id
           title
           body
          isDeleted
          priority
          dueDate
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

      expect(result?.getTodos).toEqual(mockTodos);
      expect(mockCtx.prisma.todo.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(mockCtx.prisma.todo.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('Todo Query', () => {
    it('returns a single Todo by id', async () => {
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

      mockCtx.prisma.todo.findUnique = jest.fn().mockResolvedValue(mockTodo);

      const res = await server.executeOperation(
        {
          query: `
        query GetTodo($id: ID!) {
          getTodo(id: $id) {
            id
           title
           body
          isDeleted
          priority
          dueDate
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
            id: mockTodo.id,
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.getTodo).toEqual(mockTodo);
      expect(mockCtx.prisma.todo.findUnique).toHaveBeenCalledWith({
        where: { id: mockTodo.id },
      });
      expect(mockCtx.prisma.todo.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  it('should return null for non-existent Todo', async () => {
    mockCtx.prisma.todo.findUnique = jest.fn().mockResolvedValue(null);

    const res = await server.executeOperation(
      {
        query: `
      query GetTodo($id: ID!) {
        getTodo(id: $id) {
          id
         title
         body
        isDeleted
        priority
        dueDate
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

    expect(result?.getTodo).toBeNull();
    expect(mockCtx.prisma.todo.findUnique).toHaveBeenCalledTimes(1);
    expect(mockCtx.prisma.todo.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
    });
  });

  describe('update Todo mutation', () => {
    it('should update a todo successfully', async () => {
      const mockUpdateTodo = {
        id: '1',
        title: 'This is a test Todo',
        body: 'This is a test todo for the body',
        priority: 'HIGH',
        dueDate: new Date().toISOString(),
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date().toISOString(),
        user: {
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockCtx.prisma.todo.update = jest.fn().mockResolvedValue(mockUpdateTodo);

      const res = await server.executeOperation(
        {
          query: `
            mutation UpdateTodo($id: ID!, $title: String, $body: String,  $priority: String) {
              updateTodo(id: $id, title: $title, body: $body, priority: $priority) {
                id
                title
                body
                isDeleted
                deletedAt
                priority
                dueDate
                updatedAt
                user {
                  email
                  username
                }
              }
            }
          `,
          variables: {
            id: '1',
            title: 'Updated Title',
            body: 'Updated body content',
            priority: 'HIGH',
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.updateTodo).toEqual(mockUpdateTodo);
      expect(mockCtx.prisma.todo.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          title: 'Updated Title',
          body: 'Updated body content',
          priority: 'HIGH',
        },
      });
      expect(mockCtx.prisma.todo.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Soft delete Todo', () => {
    it('should soft delete a Todo successfully', async () => {
      const mockTodos = [
        {
          id: '1',
          title: 'First Note',
          body: 'First note body',
          isDeleted: false,
          dueDate: new Date().toISOString(),
          priority: 'HIGH',
          deletedAt: null,
          updatedAt: new Date().toISOString(),
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        },
        {
          id: '2',
          title: 'Second Note',
          body: 'Second note body',
          isDeleted: false,
          dueDate: new Date().toISOString(),
          priority: 'LOW',
          deletedAt: null,
          updatedAt: new Date().toISOString(),
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        },
      ];

      const mockDeletedTodos = {
        ...mockTodos[0],
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock the update operation
      mockCtx.prisma.todo.update = jest
        .fn()
        .mockResolvedValue(mockDeletedTodos);

      // Execute the soft delete mutation
      const res = await server.executeOperation(
        {
          query: `
            mutation SoftDeleteTodo($id: ID!) {
              softDeleteTodo(id: $id) {
                id
                title
                body
                isDeleted
                deletedAt
                priority
                dueDate
                updatedAt
                user {
                  email
                  username
                }
              }
            }
          `,
          variables: {
            id: '1',
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      // Verify the response matches the mock deleted note
      expect(result?.softDeleteTodo).toEqual(mockDeletedTodos);

      // Verify the update was called with correct parameters
      expect(mockCtx.prisma.todo.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isDeleted: true,
          deletedAt: expect.any(String),
        },
      });

      // Verify update was called exactly once
      expect(mockCtx.prisma.todo.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete a Todo', () => {
    it('should remove the Todo from the database', async () => {
      const mockTodos = [
        {
          id: '1',
          title: 'First Note',
          body: 'First note body',
          isDeleted: true,
          priority: 'LOW',
          dueDate: new Date().toISOString(),
          deletedAt: null,
          updatedAt: new Date().toISOString(),
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        },
        {
          id: '2',
          title: 'Second Note',
          body: 'Second note body',
          isDeleted: false,
          deletedAt: null,
          priority: 'CRITICAL',
          dueDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        },
      ];

      const mockDeletedTodo = mockTodos[0];

      mockCtx.prisma.todo.delete = jest.fn().mockResolvedValue(mockDeletedTodo);

      const res = await server.executeOperation(
        {
          query: `
        mutation DeleteTodo($id: ID!) {
          deleteTodo(id: $id) {
              id
              title
              body
              isDeleted
              deletedAt
              priority
              dueDate
              updatedAt
              user {
                email
                username
              }
            }
        }
        `,
          variables: {
            id: mockDeletedTodo.id,
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.deleteTodo).toEqual(mockDeletedTodo);

      expect(mockCtx.prisma.todo.delete).toHaveBeenCalledWith({
        where: { id: mockDeletedTodo.id },
      });

      expect(mockCtx.prisma.todo.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of non-existent todo', async () => {
      mockCtx.prisma.todo.delete = jest
        .fn()
        .mockRejectedValue(new Error('Todo not found'));

      const res = await server.executeOperation(
        {
          query: `
            mutation DeleteTodo($id: ID!) {
              deleteTodo(id: $id) {
                id
                title
                body
                isDeleted
                deletedAt
                dueDate
                priority
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

      const errors =
        res.body.kind === 'single' ? res.body.singleResult.errors : null;

      // Verify we got an error response
      expect(errors).toBeDefined();
      expect(errors?.[0].message).toContain('Todo not found');
    });
  });

  describe('Restore a todo', () => {
    it('Should restore a deleted todo', async () => {
      const mockTodos = [
        {
          id: '1',
          title: 'First Note',
          body: 'First note body',
          isDeleted: true,
          deletedAt: null,
          dueDate: new Date().toISOString(),
          priority: 'LOW',
          updatedAt: new Date().toISOString(),
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        },
        {
          id: '2',
          title: 'Second Note',
          body: 'Second note body',
          isDeleted: false,
          dueDate: new Date().toISOString(),
          priority: 'HIGH',
          deletedAt: null,
          updatedAt: new Date().toISOString(),
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        },
      ];

      const mockedRestoredTodo = mockTodos[0];

      mockCtx.prisma.todo.update = jest
        .fn()
        .mockResolvedValue(mockedRestoredTodo);

      const res = await server.executeOperation(
        {
          query: `
          mutation RestoreTodo($id: ID!) {
            restoreTodo(id: $id) {
              id
              title
              body
              dueDate
              priority
              isDeleted
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
            id: mockedRestoredTodo.id,
          },
        },
        { contextValue: mockCtx }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.restoreTodo).toEqual(mockedRestoredTodo);
      expect(mockCtx.prisma.todo.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });
      expect(mockCtx.prisma.todo.update).toHaveBeenCalledTimes(1);
    });
  });
});
