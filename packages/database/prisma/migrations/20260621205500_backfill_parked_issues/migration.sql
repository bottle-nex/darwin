-- Backfill: issues parked in a custom column carry the dedicated `Parked` status,
-- so `Todo` is reserved for the LLM/agent board. Enforces the invariant
-- `customColumnId IS NOT NULL` <=> `status = 'Parked'`.
UPDATE "Issue" SET "status" = 'Parked' WHERE "customColumnId" IS NOT NULL;
