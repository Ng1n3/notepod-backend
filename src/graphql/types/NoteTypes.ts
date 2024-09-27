import { GraphQLDateTime } from 'graphql-iso-date';
import { asNexusMethod, objectType } from 'nexus';
import { UserType } from './UserTypes';

export const DateTime = asNexusMethod(GraphQLDateTime, 'date');

export const NoteType = objectType({
  name: 'NoteType',
  definition(t) {
    t.string('id'),
      t.string('title'),
      t.string('body'),
      t.boolean('isDeleted'),
      t.field('createdAt', { type: 'DateTime' }),
      t.nullable.field('updatedAt', { type: 'DateTime' }),
      t.field('deletedAt', { type: 'DateTime' }),
      t.field('user', {
        type: UserType,
      });
  },
});