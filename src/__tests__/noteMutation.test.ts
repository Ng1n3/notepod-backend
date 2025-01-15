import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Mycontext } from '../interfaces';
import { createMockContext, MockContext } from '../testing/context';

describe('Note Operation', () => {
  let server: ApolloServer;
  let mockCtx: MockContext;

  beforeEach(async () => {
    mockCtx = createMockContext();

    server = new ApolloServer({
      schema: makeExecutableSchema({
        typeDefs: `
          type NoteType {
            id: ID!
            title: String!
            body: String!
            isDeleted: Boolean!
            deletedAt: String
            updatedAt: String!
            user: UserType!
          }
          type UserType {
            email: String!
            username: String!
          }
          type Query {
            getNotes(isDeleted: Boolean!): [NoteType!]!
            getNote(id: ID!): NoteType
          }
          type Mutation {
            createNote(
              title: String!
              body: String!
              deletedAt: String
              isDeleted: Boolean
            ): NoteType
            updateNote(id: ID!, title: String, body: String): NoteType
          }
        `,
        resolvers: {
          Mutation: {
            createNote: async (_parent, args, __: Mycontext) => {
              return mockCtx.prisma.note.create({ data: args });
            },
            updateNote: async (_parent, { id, ...data }, _: Mycontext) => {
              return mockCtx.prisma.note.update({ where: { id }, data });
            },
          },
          Query: {
            getNotes: async (_parent, { isDeleted }, _: Mycontext) => {
              return mockCtx.prisma.note.findMany({
                where: { isDeleted },
              });
            },
            getNote: async (_parent, { id }, _: Mycontext) => {
              return mockCtx.prisma.note.findUnique({
                where: { id },
              });
            },
          },
        },
      }),
    });

    // Initialize server
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
    await mockCtx.prisma.$disconnect();
  });

  describe('createNote', () => {
    it('should create a new note successfully', async () => {
      const mockNote = {
        id: '1',
        title: 'Test Note',
        body: 'This is a test note',
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date().toISOString(),
        user: {
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      // Mock the prisma create operation
      mockCtx.prisma.note.create = jest.fn().mockResolvedValue(mockNote);

      const res = await server.executeOperation(
        {
          query: `
          mutation CreateNote($title: String!, $body: String!) {
            createNote(title: $title, body: $body) {
              id
              title
              body
              isDeleted
                deletedAt
                updatedAt
                user {
                  email
                  username
                  }
                  }
                  }`,
          variables: {
            title: mockNote.title,
            body: mockNote.body,
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.createNote).toEqual(mockNote);
      expect(mockCtx.prisma.note.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Note query', () => {
    it('Should return all notes', async () => {
      const mockNotes = [
        {
          id: '1',
          title: 'First Note',
          body: 'First note body',
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
          title: 'Second Note',
          body: 'Second note body',
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date().toISOString(),
          user: {
            email: 'test@example.com',
            username: 'testuser',
          },
        },
      ];

      mockCtx.prisma.note.findMany = jest.fn().mockResolvedValue(mockNotes);

      const res = await server.executeOperation(
        {
          query: `
          query GetNotes($isDeleted: Boolean!) {
            getNotes(isDeleted: $isDeleted) {
              id
             title
             body
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
            isDeleted: false,
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.getNotes).toEqual(mockNotes);
      expect(mockCtx.prisma.note.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(mockCtx.prisma.note.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('Note Query', () => {
    it('should return a single note by Id', async () => {
      const mockNote = {
        id: '1',
        title: 'Test Note',
        body: 'This is a test note',
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date().toISOString(),
        user: {
          email: 'test@example.com',
          username: 'testUser',
        },
      };

      mockCtx.prisma.note.findUnique = jest.fn().mockResolvedValue(mockNote);

      const res = await server.executeOperation(
        {
          query: `
          query GetNote($id: ID!) {
            getNote(id: $id) {
              id
              title
              body
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
            id: '1',
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.getNote).toEqual(mockNote);
      expect(mockCtx.prisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockCtx.prisma.note.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  it('should return null for non-existent note', async () => {
    mockCtx.prisma.note.findUnique = jest.fn().mockResolvedValue(null);

    const res = await server.executeOperation(
      {
        query: `
        query GetNote($id: ID!) {
          getNote(id: $id) {
            id
            title
            body
            isDeleted
            deletedAt
            updatedAt
            user {
              email
              username
            }
          }
        }`,
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

    expect(result?.getNote).toBeNull();
    expect(mockCtx.prisma.note.findUnique).toHaveBeenCalledTimes(1);
    expect(mockCtx.prisma.note.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
    });
  });

  describe('updateNote mutation', () => {
    it('should update a note successfully', async () => {
      const mockUpdatedNote = {
        id: '1',
        title: 'Updated Title',
        body: 'Updated body content',
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date().toISOString(),
        user: {
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockCtx.prisma.note.update = jest.fn().mockResolvedValue(mockUpdatedNote);

      const res = await server.executeOperation(
        {
          query: `
            mutation UpdateNote($id: ID!, $title: String, $body: String) {
              updateNote(id: $id, title: $title, body: $body) {
                id
                title
                body
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
            id: '1',
            title: 'Updated Title',
            body: 'Updated body content',
          },
        },
        {
          contextValue: mockCtx,
        }
      );

      const result =
        res.body.kind === 'single' ? res.body.singleResult.data : null;

      expect(result?.updateNote).toEqual(mockUpdatedNote);
      expect(mockCtx.prisma.note.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          title: 'Updated Title',
          body: 'Updated body content',
        },
      });
      expect(mockCtx.prisma.note.update).toHaveBeenCalledTimes(1);
    });
  });

  // it('deletes a note', async () => {
  //   const { mutate } = createTestClient(server);

  //   const res = await mutate({
  //     mutation: `
  //       mutation {
  //         deleteNote(
  //           id: "test-note-id"
  //         ) {
  //           id
  //           title
  //           body
  //           isDeleted
  //           deletedAt
  //           updatedAt
  //           user {
  //             email
  //             username
  //           }
  //         }
  //       }
  //     `,
  //   });

  //   expect(res.data.deleteNote.id).toBe('test-note-id');
  // });

  // it('restores a note', async () => {
  //   const { mutate } = createTestClient(server);

  //   const res = await mutate({
  //     mutation: `
  //       mutation {
  //         restoreNote(
  //           id: "test-note-id"
  //           isDeleted: false
  //           deletedAt: null
  //         ) {
  //           id
  //           title
  //           body
  //           isDeleted
  //           deletedAt
  //           updatedAt
  //           user {
  //             email
  //             username
  //           }
  //         }
  //       }
  //     `,
  //   });

  //   expect(res.data.restoreNote.id).toBe('test-note-id');
  //   expect(res.data.restoreNote.isDeleted).toBe(false);
  //   expect(res.data.restoreNote.deletedAt).toBe(null);
  // });

  // it('soft deletes a note', async () => {
  //   const { mutate } = createTestClient(server);

  //   const res = await mutate({
  //     mutation: `
  //       mutation {
  //         softDeleteNote(
  //           id: "test-note-id"
  //         ) {
  //           id
  //           title
  //           body
  //           isDeleted
  //           deletedAt
  //           updatedAt
  //           user {
  //             email
  //             username
  //           }
  //         }
  //       }
  //     `,
  //   });

  //   expect(res.data.softDeleteNote.id).toBe('test-note-id');
  //   expect(res.data.softDeleteNote.isDeleted).toBe(true);
  // });
});
