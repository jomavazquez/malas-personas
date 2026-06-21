/*
  Warnings:

  - You are about to drop the column `isPremium` on the `decks` table. All the data in the column will be lost.
  - You are about to drop the column `isPremium` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_teamId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_teamId_fkey";

-- AlterTable
ALTER TABLE "decks" DROP COLUMN "isPremium";

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "isPremium",
DROP COLUMN "teamId",
ADD COLUMN     "pointsToWin" INTEGER NOT NULL DEFAULT 5,
ALTER COLUMN "maxPlayers" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "teamId";

-- DropTable
DROP TABLE "teams";

-- DropEnum
DROP TYPE "Plan";
