import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Mycontext } from '../interfaces';
import { createMockContext, MockContext } from '../testing/context';

describe('Note Mutations', () => {
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
            _: Boolean
          }
          type Mutation {
            createNote(
              title: String!
              body: String!
              deletedAt: String
              isDeleted: Boolean
            ): NoteType
          }
        `,
        resolvers: {
          Mutation: {
            createNote: async (_parent, _, __: Mycontext) => {
              return mockCtx.prisma.note.create();
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

      // console.log('Response: ', JSON.stringify(res.body, null, 2));
      // console.log(mockCtx.prisma.note.create.mock);
      // console.log('context: ', ctx);

      expect(res.body.singleResult.data?.createNote).toEqual(mockNote);
      expect(mockCtx.prisma.note.create).toHaveBeenCalledTimes(1)
    });
  });

  // it('updates a note', async () => {
  //   const { mutate } = createTestClient(server);

  //   const res = await mutate({

  //     mutation: `
  //       mutation {
  //         updateNote(
  //           id: "test-note-id"
  //           title: "Updated Test Note"
  //           body: "This is an updated test note"
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

  //   expect(res.data.updateNote.title).toBe('Updated Test Note');
  //   expect(res.data.updateNote.body).toBe('This is an updated test note');
  // });

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
