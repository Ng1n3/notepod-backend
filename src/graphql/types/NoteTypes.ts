import { objectType } from 'nexus';
import { UserType } from './UserTypes';

export const NoteType = objectType({
  name: 'NoteType',
  definition(t) {
    t.string('id'),
      t.string('title'),
      t.string('body'),
      t.boolean('isDeleted'),
      t.field('createdAt', { type: 'DateTime' }),
      t.field('updatedAt', { type: 'DateTime' }),
      t.field('deletedAt', { type: 'DateTime' }),
      t.field('user', { type: UserType });
  },
});

///

////