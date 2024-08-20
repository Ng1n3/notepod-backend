import argon from 'argon2';
import { Mycontext } from './interfaces';

export const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = await argon.hash(password);
  return hashedPassword;
};

export const verifyPassword = async (
  inputPassword: string,
  dbPassword: string
): Promise<boolean> => {
  const isCorrect = await argon.verify(dbPassword, inputPassword);
  return isCorrect;
};

export const isProd = () => process.env.NODE_ENV === 'production';

export const isAuthenticated = (context: Mycontext): boolean => {
 const {session} = context
 return !!session.userId;
  // if (context.session.userId) return true;
  // return false;
};
