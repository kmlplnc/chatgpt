/*
  Warnings:

  - A unique constraint covering the columns `[access_code]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "access_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clients_access_code_key" ON "clients"("access_code");
