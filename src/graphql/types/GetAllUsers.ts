import { objectType } from "nexus";

export const GetAllUsers = objectType({
  name: 'user',
  definition(t) {
    t.string('id'),
    t.string('email'),
    t.string('username')
  }
})