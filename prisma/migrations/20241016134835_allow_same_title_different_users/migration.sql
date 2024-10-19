/*
  Warnings:

  - A unique constraint covering the columns `[title,userId]` on the table `notes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "notes_title_userId_key" ON "notes"("title", "userId");
