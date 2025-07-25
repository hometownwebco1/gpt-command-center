/*
  Warnings:

  - You are about to drop the column `timestamp` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `GPTLog` table. All the data in the column will be lost.
  - Added the required column `pipeline` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "from" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ChatMessage" ("from", "id", "text") SELECT "from", "id", "text" FROM "ChatMessage";
DROP TABLE "ChatMessage";
ALTER TABLE "new_ChatMessage" RENAME TO "ChatMessage";
CREATE TABLE "new_GPTLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gptId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_GPTLog" ("gptId", "id", "prompt", "response") SELECT "gptId", "id", "prompt", "response" FROM "GPTLog";
DROP TABLE "GPTLog";
ALTER TABLE "new_GPTLog" RENAME TO "GPTLog";
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignedGPT" TEXT NOT NULL,
    "pipeline" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "needsAction" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Task" ("approved", "assignedGPT", "createdAt", "id", "needsAction", "status", "title", "updatedAt") SELECT "approved", "assignedGPT", "createdAt", "id", "needsAction", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
