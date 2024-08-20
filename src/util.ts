import argon from 'argon2';

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
