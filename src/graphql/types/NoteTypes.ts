import { objectType } from "nexus";
import { UserType } from "./UserTypes";

export const NoteType = objectType({
  name: 'NoteType',
  definition(t) {
    t.string('id'),
    t.string('title'),
    t.string('body'),
    t.boolean('isDeleted'),
    t.float('createdAt'),
    t.float('updatedAt'),
    t.float('deletedAt'),
    t.field('user', {
      type: UserType
    })
  }
})