-- CreateTable
CREATE TABLE "NoteShare" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "sharedBy" TEXT NOT NULL,
    "sharedWith" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteShare_sharedWith_idx" ON "NoteShare"("sharedWith");

-- CreateIndex
CREATE INDEX "NoteShare_noteId_idx" ON "NoteShare"("noteId");

-- CreateIndex
CREATE INDEX "NoteShare_sharedBy_idx" ON "NoteShare"("sharedBy");

-- CreateIndex
CREATE UNIQUE INDEX "NoteShare_noteId_sharedWith_key" ON "NoteShare"("noteId", "sharedWith");

-- AddForeignKey
ALTER TABLE "NoteShare" ADD CONSTRAINT "NoteShare_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "SmartNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
