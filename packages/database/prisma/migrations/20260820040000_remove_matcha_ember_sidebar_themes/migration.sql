BEGIN;

ALTER TABLE "User" ALTER COLUMN "sidebarTheme" DROP DEFAULT;

UPDATE "User"
SET "sidebarTheme" = 'TimeOfDay'
WHERE "sidebarTheme"::text IN ('Matcha', 'Ember');

CREATE TYPE "SidebarTheme_new" AS ENUM ('TimeOfDay', 'Lilac', 'Slate', 'Neutral');

ALTER TABLE "User"
ALTER COLUMN "sidebarTheme" TYPE "SidebarTheme_new"
USING ("sidebarTheme"::text::"SidebarTheme_new");

DROP TYPE "SidebarTheme";

ALTER TYPE "SidebarTheme_new" RENAME TO "SidebarTheme";

ALTER TABLE "User" ALTER COLUMN "sidebarTheme" SET DEFAULT 'TimeOfDay';

COMMIT;
