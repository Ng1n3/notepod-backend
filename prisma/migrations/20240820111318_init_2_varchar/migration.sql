/*
  Warnings:

  - You are about to alter the column `fieldname` on the `password` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.
  - You are about to alter the column `email` on the `password` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.
  - You are about to alter the column `title` on the `todos` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.

*/
-- AlterTable
ALTER TABLE "password" ALTER COLUMN "fieldname" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "todos" ALTER COLUMN "title" SET DATA TYPE VARCHAR(256);
