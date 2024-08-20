import { objectType } from "nexus";
import { UserType } from "./UserTypes";

export const TodoType = objectType({
  name: 'TodoType',
  definition(t) {
    t.string('id'),
    t.string('title'),
    t.string('body'),
    t.string('priority'),
    t.boolean('isDeleted'),
    t.float('createdAt'),
    t.float('updatedAt'),
    t.float('deletedAt'),
    t.field('user', {
      type: UserType
    })
  }
})