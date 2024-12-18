import { makeSchema } from 'nexus';
import path from 'path';
import { DateTime } from '../util';
import { Mutation } from './Mutation';
import { Query } from './Query';
import { GetAllUsers } from './types/GetAllUsers';
import { NoteType } from './types/NoteTypes';
import { PasswordType } from './types/PasswordTypes';
import { TodoType } from './types/TodoTypes';
import { UserType } from './types/UserTypes';

export const getSchema = () => {
  const schema = makeSchema({
    types: [
      DateTime,
      Query,
      Mutation,
      UserType,
      NoteType,
      PasswordType,
      TodoType,
      GetAllUsers,
    ],
    outputs: {
      schema: path.join(process.cwd(), 'nexus', 'schema.graphql'),
      typegen: path.join(process.cwd(), 'nexus', 'nexus.ts'),
    },
  });
  return schema;
};
