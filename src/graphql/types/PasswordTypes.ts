import { objectType } from "nexus";
import { UserType } from "./UserTypes";

export const PasswordType = objectType({
  name: 'PasswordType',
  definition(t) {
    t.string('id'),
    t.string('fieldname'),
    t.string('email'),
    t.string('password'),
    t.boolean('isDeleted'),
    t.float('createdAt'),
    t.float('updatedAt'),
    t.float('deletedAt'),
    t.field('user', {
      type: UserType
    })
  }
})