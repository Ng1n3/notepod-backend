import { z } from 'zod';

export const ZodUser = z.object({
  username: z
    .string()
    .max(255, { message: 'Must be 255 or less characters long' })
    .min(5, { message: 'Must be 5 or more characters long' }),
  email: z.string().email({ message: 'Must be an email' }),
  password: z
    .string()
    .min(5, { message: 'Must be 5 or more characters long' })
    .max(20, { message: 'Must be 20 or less characters long' }),
  note: z.array(z.lazy(() => ZodNote)).optional(),
  todo: z.array(z.lazy(() => ZodTodo)).optional(),
});

export const ZodUpdateUser = z.object({
  password: z
    .string()
    .min(5, { message: 'Must be 5 or more characters long' })
    .max(20, { message: 'Must be 20 or less characters long' }),
});

export const ZodNote = z.object({
  title: z
    .string()
    .max(255, { message: 'Must be fewer than 255 characters long' })
    .nullable()
    .optional(),
  body: z.string().optional(),
  isDeleted: z.boolean().default(false).optional(),
  userId: z.string().uuid().optional(),
  deletedAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const ZodTodo = z.object({
  title: z
    .string()
    .max(255, { message: 'Must be fewer than 255 characters long' })
    .nullable()
    .optional(),
  body: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  isDeleted: z.boolean().default(false),
  dueDate: z.date().default(() =>new Date()),
  userId: z.string().uuid(),
  deletedAt: z.date().nullable().optional(),
});

export const ZodPassword = z.object({
  fieldname: z
    .string()
    .max(255, { message: 'Must be fewer than 255 characters long' })
    .optional()
    .nullable(),
  email: z.string().optional(),
  username: z.string().optional(),
  priority: z.enum(['LOW', 'MEDUM', 'HIGH', 'CRITICAL']).default('LOW'),
  password: z.string().nullable().optional(),
  isDeleted: z.boolean().default(false),
  userId: z.string().uuid(),
  deletedAt: z.date().nullable().optional(),
});

export type UserInput = z.infer<typeof ZodUser>;
export type NoteInput = z.infer<typeof ZodNote>;
export type TodoInput = z.infer<typeof ZodTodo>;
export type PasswordInput = z.infer<typeof ZodPassword>;
export type UserUpdate = z.infer<typeof ZodUpdateUser>;
