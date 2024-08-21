import { mutationType } from 'nexus';
import { userMutation } from './mutations/userMutation';
import { noteMutation } from './mutations/noteMutation';
import { todoMutation } from './mutations/todoMutation';

export const Mutation = mutationType({
  definition(t) {
    userMutation(t);
    noteMutation(t);
    todoMutation(t);
  },
});
