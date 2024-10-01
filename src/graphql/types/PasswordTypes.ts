import { objectType } from 'nexus';
import { UserType } from './UserTypes';

export const PasswordType = objectType({
  name: 'PasswordType',
  definition(t) {
    t.string('id'),
      t.string('fieldname'),
      t.string('email'),
      t.string('password'),
      t.string('username'),
      t.boolean('isDeleted'),
      t.field('createdAt', { type: 'DateTime' }),
      t.field('updatedAt', { type: 'DateTime' }),
      t.field('deletedAt', { type: 'DateTime' }),
      t.field('user', {
        type: UserType,
      });
  },
});