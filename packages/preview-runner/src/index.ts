import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";
import { check } from "./check";
import {
    checkInputSchema,
    detectInputSchema,
    scaffoldInputSchema,
    shootInputSchema,
    type DoctorOutput,
} from "./contract";
import { detect } from "./detect";
import { scaffold } from "./scaffold";
import { shoot } from "./shoot";

const COMMANDS = ["detect", "scaffold", "check", "shoot", "doctor"] as const;
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

        const odiff = await import("odiff-bin");
        return {
            ok: true,
            chromiumVersion: version,
            chromiumPath: executablePath,
            odiff: typeof odiff.compare === "function",
            error: null,
        };
    } catch (error) {
        return {
            ok: false,
            chromiumVersion: null,
            chromiumPath: null,
            odiff: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function run(command: Command, input: unknown): Promise<unknown> {
    switch (command) {
        case "detect":
            return detect(detectInputSchema.parse(input));
        case "scaffold":
            return scaffold(scaffoldInputSchema.parse(input));
        case "check":
            return check(checkInputSchema.parse(input));
        case "shoot":
            return shoot(shootInputSchema.parse(input));
        case "doctor":
            return doctor();
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
