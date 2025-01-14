import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { noteMutation } from '../graphql/mutations/noteMutation';
import { Mycontext } from '../interfaces';
import { createMockContext, MockContext } from '../testing/context';

let mockCtx: MockContext;
let ctx: Mycontext;

const schema = makeExecutableSchema({
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
      updateNote(
        id: String!
        title: String
        body: String
        deletedAt: String
        isDeleted: Boolean
      ): NoteType
      deleteNote(
        id: String!
      ): NoteType
      restoreNote(
        id: String!
        isDeleted: Boolean
        deletedAt: String
      ): NoteType
      softDeleteNote(
        id: String!
      ): NoteType
    }
  `,
  resolvers: {
    Mutation: {
      ...noteMutation,
    },
  },
});

describe('Note Mutations', () => {
  let server: ApolloServer;

  beforeEach(() => {
    mockCtx = createMockContext();
    ctx = mockCtx as any;
  });

  server = new ApolloServer({
    schema,
    context: async () => ctx,
  });

  afterEach(async () => {
    await mockCtx.prisma.$disconnect();
  });

  describe('createNote', async () => {
    it('should create a new note successfully', async() => {
      
    })
    const res = await server.executeOperation({
      query: `
        mutation {
          createNote(
            title: "Test Note"
            body: "This is a test note"
            ) {
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
    });

    console.log(res);
    // expect(res.data.createNote.title).toBe('Test Note');
    // expect(res.data.createNote.body).toBe('This is a test note');
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
