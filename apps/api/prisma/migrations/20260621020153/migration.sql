-- CreateTable
CREATE TABLE "FailureLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "errorCode" TEXT NOT NULL,
    "inputMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailureLog_pkey" PRIMARY KEY ("id")
);
