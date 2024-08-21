import { mutationType } from 'nexus';
import { noteMutation } from './mutations/noteMutation';
import { passwordMutation } from './mutations/passwordMutation';
import { todoMutation } from './mutations/todoMutation';
import { userMutation } from './mutations/userMutation';

export const Mutation = mutationType({
  definition(t) {
    userMutation(t);
    noteMutation(t);
    todoMutation(t);
    passwordMutation(t);
  },
});
