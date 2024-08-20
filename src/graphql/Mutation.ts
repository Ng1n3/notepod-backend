import { mutationType } from 'nexus';
import { userMutation } from './mutations/userMutation';

export const Mutation = mutationType({
  definition(t) {
    userMutation(t);
  },
});
