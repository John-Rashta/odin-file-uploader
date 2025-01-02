-- CreateTable
CREATE TABLE "ShareCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "folderid" INTEGER NOT NULL,
    "userid" INTEGER NOT NULL,

    CONSTRAINT "ShareCode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShareCode" ADD CONSTRAINT "ShareCode_folderid_fkey" FOREIGN KEY ("folderid") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareCode" ADD CONSTRAINT "ShareCode_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
