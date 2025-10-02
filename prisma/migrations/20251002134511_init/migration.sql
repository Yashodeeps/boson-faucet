-- CreateTable
CREATE TABLE "claim_records" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claim_records_address_key" ON "claim_records"("address");
