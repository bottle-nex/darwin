import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..", "..");
const ICONS_DIR = join(ROOT, "packages/ui/icons");
const map = JSON.parse(readFileSync(join(SCRIPT_DIR, "icon-map.json"), "utf8"));

const FOLDER_NAMES: Record<string, string> = {
    actions: "actions",
    navigation: "navigation",
    status: "status",
    people: "people",
    communication: "communication",
    git: "git",
    settingsAccess: "settings-access",
    kanban: "kanban",
    editor: "editor",
    activity: "activity",
    review: "review",
    gantt: "gantt",
    templates: "templates",
    misc: "misc",
    marketing: "marketing",
};

type Usage = { file: string; module: string; export: string };
type Entry = { name: string; usages: Usage[] };

const barrelLines: string[] = [];

for (const [category, folder] of Object.entries(FOLDER_NAMES)) {
    const entries = map[category] as Entry[] | undefined;
    if (!entries) continue;
    const dir = join(ICONS_DIR, folder);
    mkdirSync(dir, { recursive: true });
    for (const entry of entries) {
        const source = entry.usages[0];
        if (!source) throw new Error(`${entry.name} has no usages`);
        const filePath = join(dir, `${entry.name}.tsx`);
        const content = `import { ${source.export} } from "${source.module}";

import { createIcon } from "../createIcon";

export const ${entry.name} = createIcon(${source.export});
`;
        writeFileSync(filePath, content);
        barrelLines.push(`export { ${entry.name} } from "./${folder}/${entry.name}";`);
    }
}

for (const entry of map.customIconMoves as Array<Entry & { newFile: string }>) {
    const relativePath = entry.newFile.replace("packages/ui/icons/", "./").replace(/\.tsx$/, "");
    if (!existsSync(join(ROOT, entry.newFile))) {
        throw new Error(`${entry.newFile} does not exist yet — run Task 4 first`);
    }
    barrelLines.push(`export { ${entry.name} } from "${relativePath}";`);
}

barrelLines.push(`export * from "./catalog";`);
barrelLines.sort();

writeFileSync(join(ICONS_DIR, "index.ts"), barrelLines.join("\n") + "\n");
console.log(`Generated ${barrelLines.length - 1} icon files and the barrel.`);
