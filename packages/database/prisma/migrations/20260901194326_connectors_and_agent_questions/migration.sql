-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('Slack', 'Telegram');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('Active', 'Revoked');

-- RenameEnum
ALTER TYPE "SetupQuestionType" RENAME TO "AgentQuestionType";

-- RenameEnum
ALTER TYPE "SetupQuestionStatus" RENAME TO "AgentQuestionStatus";

-- RenameTable
ALTER TABLE "SetupQuestion" RENAME TO "AgentQuestion";

-- RenameConstraint
ALTER TABLE "AgentQuestion" RENAME CONSTRAINT "SetupQuestion_pkey" TO "AgentQuestion_pkey";

-- RenameConstraint
ALTER TABLE "AgentQuestion" RENAME CONSTRAINT "SetupQuestion_sessionId_fkey" TO "AgentQuestion_setupSessionId_fkey";

-- RenameConstraint
ALTER TABLE "AgentQuestion" RENAME CONSTRAINT "SetupQuestion_secretId_fkey" TO "AgentQuestion_secretId_fkey";

-- RenameColumn
ALTER TABLE "AgentQuestion" RENAME COLUMN "sessionId" TO "setupSessionId";

-- AlterTable
ALTER TABLE "AgentQuestion" ALTER COLUMN "setupSessionId" DROP NOT NULL,
    ADD COLUMN "agentSessionId" TEXT,
    ADD COLUMN "expiresAt" TIMESTAMP(3);

-- DropIndex
DROP INDEX "SetupQuestion_sessionId_status_idx";

-- CreateIndex
CREATE INDEX "AgentQuestion_setupSessionId_status_idx" ON "AgentQuestion"("setupSessionId", "status");

-- CreateIndex
CREATE INDEX "AgentQuestion_agentSessionId_status_idx" ON "AgentQuestion"("agentSessionId", "status");

-- AddForeignKey
ALTER TABLE "AgentQuestion" ADD CONSTRAINT "AgentQuestion_agentSessionId_fkey" FOREIGN KEY ("agentSessionId") REFERENCES "AgentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "status" "ConnectorStatus" NOT NULL DEFAULT 'Active',
    "externalUserId" TEXT NOT NULL,
    "externalChatId" TEXT NOT NULL,
    "ciphertext" TEXT,
    "iv" TEXT,
    "authTag" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorLinkToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionDelivery" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "externalMessageId" TEXT NOT NULL,
    "externalChatId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "QuestionDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Connector_userId_status_idx" ON "Connector"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Connector_userId_provider_key" ON "Connector"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Connector_provider_externalUserId_key" ON "Connector"("provider", "externalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorLinkToken_token_key" ON "ConnectorLinkToken"("token");

-- CreateIndex
CREATE INDEX "ConnectorLinkToken_userId_provider_idx" ON "ConnectorLinkToken"("userId", "provider");

-- CreateIndex
CREATE INDEX "QuestionDelivery_questionId_idx" ON "QuestionDelivery"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionDelivery_connectorId_externalMessageId_key" ON "QuestionDelivery"("connectorId", "externalMessageId");

-- AddForeignKey
ALTER TABLE "Connector" ADD CONSTRAINT "Connector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorLinkToken" ADD CONSTRAINT "ConnectorLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDelivery" ADD CONSTRAINT "QuestionDelivery_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AgentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionDelivery" ADD CONSTRAINT "QuestionDelivery_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
