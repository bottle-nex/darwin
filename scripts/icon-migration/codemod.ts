import { Project } from "ts-morph";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..", "..");
const map = JSON.parse(readFileSync(join(SCRIPT_DIR, "icon-map.json"), "utf8"));

type Usage = { file: string; module: string; export: string };
type Entry = { name: string; usages: Usage[] };

const DRY_RUN = process.argv.includes("--dry-run");
const ONLY_FILES = process.argv.includes("--only")
    ? process.argv[process.argv.indexOf("--only") + 1]?.split(",")
    : undefined;

const byFile = new Map<string, Map<string, { module: string; newName: string }>>();

function addRow(name: string, row: Usage) {
    const abs = join(ROOT, row.file);
    if (ONLY_FILES && !ONLY_FILES.some((f) => abs.endsWith(f))) return;
    if (!byFile.has(abs)) byFile.set(abs, new Map());
    byFile.get(abs)!.set(row.export, { module: row.module, newName: name });
}

for (const [category, entries] of Object.entries(map)) {
    if (category.startsWith("_") || category === "manual") continue;
    for (const entry of entries as Entry[]) {
        for (const usage of entry.usages) addRow(entry.name, usage);
    }
}

const project = new Project({ tsConfigFilePath: join(ROOT, "apps/web/tsconfig.json") });
project.addSourceFilesAtPaths(join(ROOT, "apps/admin/**/*.{ts,tsx}"));

let filesTouched = 0;

for (const [absPath, renames] of byFile) {
    const sourceFile = project.addSourceFileAtPathIfExists(absPath);
    if (!sourceFile) {
        console.warn(`SKIPPED (not found): ${absPath}`);
        continue;
    }

    let touched = false;
    const neededImports = new Set<string>();

    for (const importDecl of sourceFile.getImportDeclarations()) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        for (const namedImport of [...importDecl.getNamedImports()]) {
            const importedName = namedImport.getName();
            const rename = renames.get(importedName);
            if (!rename || rename.module !== moduleSpecifier) continue;

            const nameNode = namedImport.getNameNode();
            const localReferences = nameNode
                .findReferencesAsNodes()
                .filter((node) => node.getSourceFile() === sourceFile && node !== nameNode);
            for (const reference of localReferences) reference.replaceWithText(rename.newName);
            namedImport.remove();
            neededImports.add(rename.newName);
            touched = true;
        }
        if (
            importDecl.getNamedImports().length === 0 &&
            !importDecl.getDefaultImport() &&
            !importDecl.getNamespaceImport()
        ) {
            importDecl.remove();
        }
    }

    if (touched) {
        const existing = sourceFile.getImportDeclaration(
            (d) => d.getModuleSpecifierValue() === "@trymatcha/ui/icons",
        );
        const names = [...neededImports].sort();
        if (existing) {
            const already = new Set(existing.getNamedImports().map((n) => n.getName()));
            for (const n of names) if (!already.has(n)) existing.addNamedImport(n);
        } else {
            sourceFile.addImportDeclaration({
                moduleSpecifier: "@trymatcha/ui/icons",
                namedImports: names,
            });
        }
        filesTouched++;
        console.log(`${DRY_RUN ? "[dry-run] " : ""}${absPath.replace(ROOT + "/", "")}: +${names.join(", ")}`);
    }
}

if (!DRY_RUN) project.saveSync();
console.log(`${DRY_RUN ? "[dry-run] would rewrite" : "Rewrote"} ${filesTouched} files.`);
