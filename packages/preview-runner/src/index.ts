import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";
import { capture } from "./capture";
import { check } from "./check";
import {
    captureInputSchema,
    checkInputSchema,
    createNextPreviewSurfaceInputSchema,
    detectInputSchema,
    nextWorkspaceInspectionInputSchema,
    pairInputSchema,
    removeNextPreviewSurfaceInputSchema,
    scaffoldInputSchema,
    type DoctorOutput,
} from "./contract";
import { detect } from "./detect";
import { scaffold } from "./scaffold";
import { pair } from "./pair";
import { inspect_next_workspace } from "./adapters/next/workspace";
import {
    create_next_preview_surface,
    remove_next_preview_surface,
} from "./adapters/next/preview_surface";

const RUNTIME_PROTOCOL_VERSION = 7;
const COMMANDS = [
    "detect",
    "inspect-next-workspace",
    "scaffold",
    "create-next-preview-surface",
    "remove-next-preview-surface",
    "check",
    "capture",
    "pair",
    "doctor",
    "version",
] as const;
type Command = (typeof COMMANDS)[number];

function flag(argv: string[], name: string): string | null {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? (argv[index + 1] ?? null) : null;
}

function read_input(path: string | null): unknown {
    if (!path) return {};
    return JSON.parse(readFileSync(path, "utf8"));
}

function write_output(path: string | null, value: unknown): void {
    const serialized = JSON.stringify(value, null, 2);
    if (!path) {
        process.stdout.write(`${serialized}\n`);
        return;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, serialized, "utf8");
}

async function doctor(): Promise<DoctorOutput> {
    try {
        const executablePath = chromium.executablePath();
        const browser = await chromium.launch({
            args: ["--no-sandbox", "--disable-dev-shm-usage"],
        });
        const version = browser.version();
        await browser.close();

        return {
            ok: true,
            chromiumVersion: version,
            chromiumPath: executablePath,
            error: null,
        };
    } catch (error) {
        return {
            ok: false,
            chromiumVersion: null,
            chromiumPath: null,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function run(command: Command, input: unknown): Promise<unknown> {
    switch (command) {
        case "detect":
            return detect(detectInputSchema.parse(input));
        case "inspect-next-workspace":
            return inspect_next_workspace(nextWorkspaceInspectionInputSchema.parse(input));
        case "scaffold":
            return scaffold(scaffoldInputSchema.parse(input));
        case "create-next-preview-surface": {
            const surfaceInput = createNextPreviewSurfaceInputSchema.parse(input);
            return create_next_preview_surface(surfaceInput.workspaceRoot, surfaceInput);
        }
        case "remove-next-preview-surface": {
            const { surface } = removeNextPreviewSurfaceInputSchema.parse(input);
            remove_next_preview_surface(surface);
            return { ok: true };
        }
        case "check":
            return check(checkInputSchema.parse(input));
        case "capture":
            return capture(captureInputSchema.parse(input));
        case "pair":
            return pair(pairInputSchema.parse(input));
        case "doctor":
            return doctor();
        case "version":
            return { version: RUNTIME_PROTOCOL_VERSION };
    }
}

async function main(): Promise<void> {
    const argv = process.argv.slice(2);
    const command = argv[0] as Command | undefined;

    if (!command || !COMMANDS.includes(command)) {
        process.stderr.write(
            `usage: preview-runner <${COMMANDS.join("|")}> [--input path] [--output path]\n`,
        );
        process.exit(2);
    }

    const output = await run(command, read_input(flag(argv, "input")));
    write_output(flag(argv, "output"), output);
}

main().catch((error: unknown) => {
    process.stderr.write(
        `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
    );
    process.exit(1);
});
