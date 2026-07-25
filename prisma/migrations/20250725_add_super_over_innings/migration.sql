-- CreateTable
CREATE TABLE "SuperOverInnings" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "superOverNumber" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "battingTeamId" TEXT NOT NULL,
    "bowlingTeamId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "ballsData" TEXT NOT NULL DEFAULT '[]',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "result" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperOverInnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperOverInnings_matchId_superOverNumber_teamId_key" ON "SuperOverInnings"("matchId", "superOverNumber", "teamId");

-- CreateIndex
CREATE INDEX "SuperOverInnings_matchId_idx" ON "SuperOverInnings"("matchId");

-- CreateIndex
CREATE INDEX "SuperOverInnings_teamId_idx" ON "SuperOverInnings"("teamId");

-- AddForeignKey
ALTER TABLE "SuperOverInnings" ADD CONSTRAINT "SuperOverInnings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
