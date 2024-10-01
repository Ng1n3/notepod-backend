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
    t.field('createdAt', {type: 'DateTime'}),
    t.field('updatedAt', {type: 'DateTime'}),
    t.field('deletedAt', {type: 'DateTime'}),
    t.field('dueDate', {type: 'DateTime'})
    t.field('user', {
      type: UserType
    })
  }
})