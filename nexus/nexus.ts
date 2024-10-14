/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */


import type { core } from "nexus"
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    dateTime<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // "DateTime";
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    dateTime<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // "DateTime";
  }
}


declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
}

export interface NexusGenEnums {
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
  DateTime: any
}

export interface NexusGenObjects {
  Mutation: {};
  NoteType: { // root type
    body?: string | null; // String
    createdAt?: NexusGenScalars['DateTime'] | null; // DateTime
    deletedAt?: NexusGenScalars['DateTime'] | null; // DateTime
    id?: string | null; // String
    isDeleted?: boolean | null; // Boolean
    title?: string | null; // String
    updatedAt?: NexusGenScalars['DateTime'] | null; // DateTime
    user?: NexusGenRootTypes['UserType'] | null; // UserType
  }
  PasswordType: { // root type
    createdAt?: NexusGenScalars['DateTime'] | null; // DateTime
    deletedAt?: NexusGenScalars['DateTime'] | null; // DateTime
    email?: string | null; // String
    fieldname?: string | null; // String
    id?: string | null; // String
    isDeleted?: boolean | null; // Boolean
    password?: string | null; // String
    updatedAt?: NexusGenScalars['DateTime'] | null; // DateTime
    user?: NexusGenRootTypes['UserType'] | null; // UserType
    username?: string | null; // String
  }
  Query: {};
  TodoType: { // root type
    body?: string | null; // String
    createdAt?: NexusGenScalars['DateTime'] | null; // DateTime
    deletedAt?: NexusGenScalars['DateTime'] | null; // DateTime
    dueDate?: NexusGenScalars['DateTime'] | null; // DateTime
    id?: string | null; // String
    isDeleted?: boolean | null; // Boolean
    priority?: string | null; // String
    title?: string | null; // String
    updatedAt?: NexusGenScalars['DateTime'] | null; // DateTime
    user?: NexusGenRootTypes['UserType'] | null; // UserType
  }
  UserType: { // root type
    email?: string | null; // String
    id?: string | null; // String
    note?: Array<NexusGenRootTypes['NoteType'] | null> | null; // [NoteType]
    password?: Array<NexusGenRootTypes['PasswordType'] | null> | null; // [PasswordType]
    todo?: Array<NexusGenRootTypes['TodoType'] | null> | null; // [TodoType]
    username?: string | null; // String
  }
  user: { // root type
    email?: string | null; // String
    id?: string | null; // String
    username?: string | null; // String
  }
}

export interface NexusGenInterfaces {
}

export interface NexusGenUnions {
}

export type NexusGenRootTypes = NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars

export interface NexusGenFieldTypes {
  Mutation: { // field return type
    createNote: NexusGenRootTypes['NoteType'] | null; // NoteType
    createPassword: NexusGenRootTypes['PasswordType'] | null; // PasswordType
    createTodo: NexusGenRootTypes['TodoType'] | null; // TodoType
    createUser: boolean | null; // Boolean
    deleteNote: NexusGenRootTypes['NoteType'] | null; // NoteType
    deleteTodo: boolean | null; // Boolean
    deleteUser: boolean | null; // Boolean
    deletedPassword: boolean | null; // Boolean
    loginUser: boolean | null; // Boolean
    logoutUser: boolean | null; // Boolean
    restoreNote: NexusGenRootTypes['NoteType'] | null; // NoteType
    restorePassword: NexusGenRootTypes['PasswordType'] | null; // PasswordType
    restoreTodo: NexusGenRootTypes['TodoType'] | null; // TodoType
    softDeleteNote: NexusGenRootTypes['NoteType'] | null; // NoteType
    softDeletePassword: NexusGenRootTypes['PasswordType'] | null; // PasswordType
    softDeleteTodo: NexusGenRootTypes['TodoType'] | null; // TodoType
    updateNote: NexusGenRootTypes['NoteType'] | null; // NoteType
    updatePassword: NexusGenRootTypes['PasswordType'] | null; // PasswordType
    updateTodo: NexusGenRootTypes['TodoType'] | null; // TodoType
    updateUser: boolean | null; // Boolean
  }
  NoteType: { // field return type
    body: string | null; // String
    createdAt: NexusGenScalars['DateTime'] | null; // DateTime
    deletedAt: NexusGenScalars['DateTime'] | null; // DateTime
    id: string | null; // String
    isDeleted: boolean | null; // Boolean
    title: string | null; // String
    updatedAt: NexusGenScalars['DateTime'] | null; // DateTime
    user: NexusGenRootTypes['UserType'] | null; // UserType
  }
  PasswordType: { // field return type
    createdAt: NexusGenScalars['DateTime'] | null; // DateTime
    deletedAt: NexusGenScalars['DateTime'] | null; // DateTime
    email: string | null; // String
    fieldname: string | null; // String
    id: string | null; // String
    isDeleted: boolean | null; // Boolean
    password: string | null; // String
    updatedAt: NexusGenScalars['DateTime'] | null; // DateTime
    user: NexusGenRootTypes['UserType'] | null; // UserType
    username: string | null; // String
  }
  Query: { // field return type
    getNote: NexusGenRootTypes['NoteType'] | null; // NoteType
    getNotes: Array<NexusGenRootTypes['NoteType'] | null> | null; // [NoteType]
    getPasswordField: NexusGenRootTypes['PasswordType'] | null; // PasswordType
    getPasswordFields: Array<NexusGenRootTypes['PasswordType'] | null> | null; // [PasswordType]
    getTodo: NexusGenRootTypes['TodoType'] | null; // TodoType
    getTodos: Array<NexusGenRootTypes['TodoType'] | null> | null; // [TodoType]
    getUsers: Array<NexusGenRootTypes['UserType'] | null> | null; // [UserType]
    hello: string | null; // String
  }
  TodoType: { // field return type
    body: string | null; // String
    createdAt: NexusGenScalars['DateTime'] | null; // DateTime
    deletedAt: NexusGenScalars['DateTime'] | null; // DateTime
    dueDate: NexusGenScalars['DateTime'] | null; // DateTime
    id: string | null; // String
    isDeleted: boolean | null; // Boolean
    priority: string | null; // String
    title: string | null; // String
    updatedAt: NexusGenScalars['DateTime'] | null; // DateTime
    user: NexusGenRootTypes['UserType'] | null; // UserType
  }
  UserType: { // field return type
    email: string | null; // String
    id: string | null; // String
    note: Array<NexusGenRootTypes['NoteType'] | null> | null; // [NoteType]
    password: Array<NexusGenRootTypes['PasswordType'] | null> | null; // [PasswordType]
    todo: Array<NexusGenRootTypes['TodoType'] | null> | null; // [TodoType]
    username: string | null; // String
  }
  user: { // field return type
    email: string | null; // String
    id: string | null; // String
    username: string | null; // String
  }
}

export interface NexusGenFieldTypeNames {
  Mutation: { // field return type name
    createNote: 'NoteType'
    createPassword: 'PasswordType'
    createTodo: 'TodoType'
    createUser: 'Boolean'
    deleteNote: 'NoteType'
    deleteTodo: 'Boolean'
    deleteUser: 'Boolean'
    deletedPassword: 'Boolean'
    loginUser: 'Boolean'
    logoutUser: 'Boolean'
    restoreNote: 'NoteType'
    restorePassword: 'PasswordType'
    restoreTodo: 'TodoType'
    softDeleteNote: 'NoteType'
    softDeletePassword: 'PasswordType'
    softDeleteTodo: 'TodoType'
    updateNote: 'NoteType'
    updatePassword: 'PasswordType'
    updateTodo: 'TodoType'
    updateUser: 'Boolean'
  }
  NoteType: { // field return type name
    body: 'String'
    createdAt: 'DateTime'
    deletedAt: 'DateTime'
    id: 'String'
    isDeleted: 'Boolean'
    title: 'String'
    updatedAt: 'DateTime'
    user: 'UserType'
  }
  PasswordType: { // field return type name
    createdAt: 'DateTime'
    deletedAt: 'DateTime'
    email: 'String'
    fieldname: 'String'
    id: 'String'
    isDeleted: 'Boolean'
    password: 'String'
    updatedAt: 'DateTime'
    user: 'UserType'
    username: 'String'
  }
  Query: { // field return type name
    getNote: 'NoteType'
    getNotes: 'NoteType'
    getPasswordField: 'PasswordType'
    getPasswordFields: 'PasswordType'
    getTodo: 'TodoType'
    getTodos: 'TodoType'
    getUsers: 'UserType'
    hello: 'String'
  }
  TodoType: { // field return type name
    body: 'String'
    createdAt: 'DateTime'
    deletedAt: 'DateTime'
    dueDate: 'DateTime'
    id: 'String'
    isDeleted: 'Boolean'
    priority: 'String'
    title: 'String'
    updatedAt: 'DateTime'
    user: 'UserType'
  }
  UserType: { // field return type name
    email: 'String'
    id: 'String'
    note: 'NoteType'
    password: 'PasswordType'
    todo: 'TodoType'
    username: 'String'
  }
  user: { // field return type name
    email: 'String'
    id: 'String'
    username: 'String'
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    createNote: { // args
      body?: string | null; // String
      deletedAt?: string | null; // String
      isDeleted?: boolean | null; // Boolean
      title?: string | null; // String
    }
    createPassword: { // args
      email?: string | null; // String
      fieldname?: string | null; // String
      password?: string | null; // String
      username?: string | null; // String
    }
    createTodo: { // args
      body?: string | null; // String
      deletedAt?: string | null; // String
      dueDate?: string | null; // String
      isDeleted?: boolean | null; // Boolean
      priority?: string | null; // String
      title?: string | null; // String
    }
    createUser: { // args
      email?: string | null; // String
      password?: string | null; // String
      username?: string | null; // String
    }
    deleteNote: { // args
      id?: string | null; // String
    }
    deleteTodo: { // args
      id?: string | null; // String
    }
    deleteUser: { // args
      id?: string | null; // String
    }
    deletedPassword: { // args
      id?: string | null; // String
    }
    loginUser: { // args
      email?: string | null; // String
      password?: string | null; // String
    }
    restoreNote: { // args
      deletedAt?: string | null; // String
      id?: string | null; // String
      isDeleted?: boolean | null; // Boolean
    }
    restorePassword: { // args
      deletedAt?: string | null; // String
      id?: string | null; // String
      isDeleted?: boolean | null; // Boolean
    }
    restoreTodo: { // args
      deletedAt?: string | null; // String
      id?: string | null; // String
      isDeleted?: boolean | null; // Boolean
    }
    softDeleteNote: { // args
      id?: string | null; // String
    }
    softDeletePassword: { // args
      id?: string | null; // String
    }
    softDeleteTodo: { // args
      id?: string | null; // String
    }
    updateNote: { // args
      body?: string | null; // String
      deletedAt?: string | null; // String
      id?: string | null; // String
      isDeleted?: boolean | null; // Boolean
      title?: string | null; // String
    }
    updatePassword: { // args
      deletedAt?: string | null; // String
      email?: string | null; // String
      fieldname?: string | null; // String
      id?: string | null; // String
      isDeleted?: boolean | null; // Boolean
      password?: string | null; // String
      username?: string | null; // String
    }
    updateTodo: { // args
      body?: string | null; // String
      deletedAt?: string | null; // String
      dueDate?: string | null; // String
      id?: string | null; // String
      isDeleted?: boolean | null; // Boolean
      priority?: string | null; // String
      title?: string | null; // String
    }
    updateUser: { // args
      id?: string | null; // String
      password?: string | null; // String
    }
  }
  Query: {
    getNote: { // args
      id: string; // String!
    }
    getNotes: { // args
      cursor?: number | null; // Int
      isDeleted?: boolean | null; // Boolean
    }
    getPasswordField: { // args
      id: string; // String!
    }
    getPasswordFields: { // args
      cursor?: number | null; // Int
      isDeleted?: boolean | null; // Boolean
    }
    getTodo: { // args
      id: string; // String!
    }
    getTodos: { // args
      cursor?: number | null; // Int
      isDeleted?: boolean | null; // Boolean
    }
    getUsers: { // args
      cursor?: number | null; // Int
    }
  }
}

export interface NexusGenAbstractTypeMembers {
}

export interface NexusGenTypeInterfaces {
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = never;

export type NexusGenEnumNames = never;

export type NexusGenInterfaceNames = never;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false
    resolveType: true
    __typename: false
  }
}

export interface NexusGenTypes {
  context: any;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginInputTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
  interface NexusGenPluginArgConfig {
  }
}