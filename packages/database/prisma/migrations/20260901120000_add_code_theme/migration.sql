-- CreateEnum
CREATE TYPE "CodeTheme" AS ENUM ('Matcha', 'NightOwl', 'OneDark', 'Dracula', 'Nord', 'MaterialOceanic', 'GruvboxDark', 'VscDarkPlus', 'A11yDark');

-- AlterTable
ALTER TABLE "UserConfig" ADD COLUMN     "codeTheme" "CodeTheme" NOT NULL DEFAULT 'Matcha';
