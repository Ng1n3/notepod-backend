import { objectType } from 'nexus';
import { NoteType } from './NoteTypes';
import { PasswordType } from './PasswordTypes';
import { TodoType } from './TodoTypes';

export const UserType = objectType({
  name: 'UserType',
  definition(t) {
    t.string('id'),
      t.string('username'),
      t.string('email'),
      t.list.field('note', {
        type: NoteType,
      }),
      t.list.field('password', {
        type: PasswordType,
      }),
      t.list.field('todo', {
        type: TodoType,
      });
  },
});

export const loginType = objectType({
  name: 'loginType',
  definition(t) {
    t.string('username'),
    t.string('password')
  }
})