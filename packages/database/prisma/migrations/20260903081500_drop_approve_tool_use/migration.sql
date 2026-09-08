-- Manual mode gates the pull request, not individual tool calls, so this value never had a use.
-- Postgres cannot drop a single enum value, so the type is rebuilt without it.
ALTER TYPE "AgentQuestionType" RENAME TO "AgentQuestionType_old";

CREATE TYPE "AgentQuestionType" AS ENUM ('NeedSecret', 'NeedValue', 'NeedChoice', 'Confirm', 'NeedFile', 'NeedAccess', 'DefineSuccess', 'Clarify', 'ApproveCost', 'ApprovePullRequest');

ALTER TABLE "AgentQuestion" ALTER COLUMN "type" TYPE "AgentQuestionType" USING ("type"::text::"AgentQuestionType");

DROP TYPE "AgentQuestionType_old";
