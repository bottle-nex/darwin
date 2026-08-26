import type Logger from "@trymatcha/logger";
import type { CapsuleChange, CapsuleControl, CapsuleViewport } from "@trymatcha/types";
import type { Sandbox } from "e2b";
import { z } from "zod";

import { ENV } from "../conf/config.env";
import { capsules_dir, harness_dir, OVERRIDES_FILE } from "./service.capsule_harness";
import type { CapsuleTarget } from "./service.capsule_targets";
import type { AppProfile } from "./service.capsule_workspace";
import ClaudeRun from "./service.claude_run";

const AUTHOR_PROMPT_PATH = "/home/user/capsule_author_prompt.txt";
const REPAIR_PROMPT_PATH = "/home/user/capsule_repair_prompt.txt";
const AUTHOR_TIMEOUT_MS = 20 * 60_000;
const REPAIR_TIMEOUT_MS = 12 * 60_000;
const FIXTURE_IMPORT = /from\s+["']\.\/fixture\.json["']/;
const ANY_FIXTURE_IMPORT = /from\s+["']\.\/[\w.-]*fixture[\w.-]*\.json["']/;

const control_schema = z
    .object({
        name: z.string().min(1).max(64),
        kind: z.enum(["enum", "boolean", "string", "number"]),
        options: z.array(z.string().max(120)).min(1).max(20).optional(),
        default: z.union([z.string().max(500), z.number(), z.boolean()]),
    })
    .strict()
    .refine(
        (control) => control.kind !== "enum" || (control.options?.length ?? 0) > 0,
        "an enum control needs the options it can take",
    );

export const capsule_spec_schema = z
    .object({
        title: z.string().min(1).max(80),
        viewport: z
            .object({
                width: z.number().int().min(80).max(2560),
                height: z.number().int().min(40).max(2000),
            })
            .strict(),
        controls: z.array(control_schema).max(12),
    })
    .strict();

export interface CapsuleSpec {
    id: string;
    title: string;
    componentPath: string;
    change: CapsuleChange;
    viewport: CapsuleViewport;
    controls: CapsuleControl[];
    entries: { base: boolean; head: boolean };
}

export interface CapsuleFailure {
    capsuleId: string;
    revision: "base" | "head";
    diagnostics: string[];
}

export function capsule_dir(profile: AppProfile, capsule_id: string): string {
    return `${capsules_dir(profile)}/${capsule_id}`;
}

export function reject_split_fixture(entries: {
    base: string | null;
    head: string | null;
}): string | null {
    const present = [entries.base, entries.head].filter((entry): entry is string => entry !== null);
    if (present.length === 0) return "no capsule entry was written";

    for (const entry of present) {
        if (ANY_FIXTURE_IMPORT.test(entry) && !FIXTURE_IMPORT.test(entry)) {
            return "an entry reads a fixture other than ./fixture.json, so the two revisions would not render identical data";
        }
    }

    const reading = present.filter((entry) => FIXTURE_IMPORT.test(entry));
    if (reading.length > 0 && reading.length !== present.length) {
        return "only one revision reads the fixture, so the two sides would not render identical data";
    }
    return null;
}

export function build_author_prompt(targets: CapsuleTarget[], profile: AppProfile): string {
    const root = capsules_dir(profile);
    const styling =
        profile.tailwindMajor === null
            ? "This project does not use Tailwind. Do not add Tailwind classes that do not already exist."
            : `This project uses Tailwind v${profile.tailwindMajor}. Its global stylesheet is already loaded for you.`;

    const list = targets
        .map((target) => {
            const base =
                target.change === "Added"
                    ? `${file_name(target.componentPath)} does not exist at the base revision, so write head.tsx only.`
                    : target.change === "Removed"
                      ? `${file_name(target.componentPath)} is deleted at the head revision, so write base.tsx only.`
                      : "Write both base.tsx and head.tsx.";
            return [
                `- id: ${target.id}`,
                `  component: ${target.componentPath}`,
                `  base component: ${target.basePath ?? "(none)"}`,
                `  ${base}`,
            ].join("\n");
        })
        .join("\n");

    return `You are preparing interactive previews of the components this pull request changed.

Each component is rendered on its own blank page so a reviewer can compare it before and after. Both revisions are already checked out; the working tree is at the head revision.

${styling}

Write these files for each capsule below, under ${root}/<id>/

1. fixture.json, only when the component actually takes data
   A component that hardcodes its own content needs no fixture. Skip the file, and have the entries render the component with no props.
   Otherwise: the synthetic data the component needs, one file per capsule.
   THIS FILE IS SHARED BY BOTH REVISIONS AND MUST STAY THAT WAY. Never write a second fixture. The reviewer is comparing before against after, so both sides must receive identical data. If the two sides get different data, every difference you invent shows up as a fake change in the review.
   Give it believable content, not "foo" and "bar". Realistic lengths matter: if a title is normally forty characters, do not write four.

2. capsule.json
   { "title": string, "viewport": { "width": number, "height": number }, "controls": [...] }
   title is the component name a reviewer would recognise.
   viewport is a sensible size for this component alone, not a full page.
   controls come from the component's own props. Read its TypeScript types:
     - a union of string literals becomes { "name", "kind": "enum", "options": [...], "default" }
     - a boolean prop becomes { "name", "kind": "boolean", "default" }
     - a short string or number prop becomes { "name", "kind": "string" | "number", "default" }
   Skip props that are objects, arrays, functions, or React children. Those live in fixture.json.

3. head.tsx, and base.tsx unless told otherwise below
   Each default-exports a React component taking { controls }:

     import fixture from "./fixture.json";
     import { Thing } from "../../../<path to the real component>";

     export default function Capsule({ controls }: { controls: Record<string, string> }) {
         return <Thing {...fixture} variant={controls.variant ?? "default"} />;
     }

   Rules for these entry files:
   - Import the REAL component from its real path. Never copy, rewrite or reimplement it.
   - base.tsx must import from the base revision path when it differs from head.
   - Wrap the component in whatever providers its subtree needs, seeded from fixture.json, so nothing throws on mount.
   - Pass no-op functions for callback props.
   - controls values arrive as strings. Convert them: controls.open === "true" for a boolean.
   - The controls object changes while the page is open. Read it from props on every render; never cache it in module scope.
   - Do NOT stub fetch, XMLHttpRequest or WebSocket. The harness already replaced all three before your code runs.
   - Do NOT edit any file outside ${root}/. The repository must stay exactly as it is.

Capsules to write:
${list}

Work until every listed capsule has its files. Then stop.`;
}

export function build_repair_prompt(
    failures: CapsuleFailure[],
    capsules_root: string,
    overrides_path: string,
): string {
    const list = failures
        .map((failure) =>
            [
                `- capsule: ${failure.capsuleId}`,
                `  revision: ${failure.revision}`,
                `  file: ${capsules_root}/${failure.capsuleId}/${failure.revision}.tsx`,
                `  what went wrong:`,
                ...failure.diagnostics.map((line) => `    ${line}`),
            ].join("\n"),
        )
        .join("\n");

    return `Some capsule previews did not render. Fix only the ones listed here.

${list}

For each one, read the entry file and the component it imports, then fix the entry so the component mounts and paints something visible.

Common causes: a missing provider, a prop shape that does not match the component's type, data missing from fixture.json, or a hook that needs a value the fixture does not supply.

If the build cannot resolve an import, that is a project-wide problem and no edit to a capsule entry will fix it. Answer it in ${overrides_path}, which is the one harness file that is never regenerated:

    export default {
        aliases: { "some/specifier": "/absolute/path/to/the/file.ts" },
        external: [],
    };

Its aliases are merged into the build's own, and external leaves an import unbundled. Prefer an alias pointing at the real file; reach for external only when the import genuinely has no source in this repository.

Rules that still hold:
- fixture.json is shared by both revisions. If you change it, both sides change together. Never write a second fixture file.
- Never edit the component itself, and never edit any harness file other than the overrides above.
- Do not stub fetch, XMLHttpRequest or WebSocket. The harness already did.

Fix the listed capsules, then stop.`;
}

function file_name(path: string): string {
    return path.split("/").pop() ?? path;
}

export default class CapsuleAuthor {
    public static async write_capsules(
        sandbox: Sandbox,
        log: Logger,
        targets: CapsuleTarget[],
        profile: AppProfile,
    ): Promise<{ specs: CapsuleSpec[]; warnings: string[] }> {
        await sandbox.commands.run(`mkdir -p ${capsules_dir(profile)}`);
        await sandbox.files.write(AUTHOR_PROMPT_PATH, build_author_prompt(targets, profile));

        log.step("authoring capsules", { count: targets.length });
        await ClaudeRun.execute(sandbox, log, {
            prompt_path: AUTHOR_PROMPT_PATH,
            model: ENV.SERVER_PREVIEW_MODEL,
            effort: ENV.SERVER_PREVIEW_EFFORT,
            envs: { CLAUDE_CODE_OAUTH_TOKEN: ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN },
            timeout_ms: AUTHOR_TIMEOUT_MS,
            label: "capsule authoring agent",
        });

        return this.collect(sandbox, profile, targets, log);
    }

    public static async repair(
        sandbox: Sandbox,
        log: Logger,
        profile: AppProfile,
        failures: CapsuleFailure[],
    ): Promise<void> {
        await sandbox.files.write(
            REPAIR_PROMPT_PATH,
            build_repair_prompt(
                failures,
                capsules_dir(profile),
                `${harness_dir(profile)}/${OVERRIDES_FILE}`,
            ),
        );

        log.step("repairing capsules", { count: failures.length });
        await ClaudeRun.execute(sandbox, log, {
            prompt_path: REPAIR_PROMPT_PATH,
            model: ENV.SERVER_PREVIEW_MODEL,
            effort: ENV.SERVER_PREVIEW_EFFORT,
            envs: { CLAUDE_CODE_OAUTH_TOKEN: ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN },
            timeout_ms: REPAIR_TIMEOUT_MS,
            label: "capsule repair agent",
        });
    }

    public static async collect(
        sandbox: Sandbox,
        profile: AppProfile,
        targets: CapsuleTarget[],
        log: Logger,
    ): Promise<{ specs: CapsuleSpec[]; warnings: string[] }> {
        const specs: CapsuleSpec[] = [];
        const warnings: string[] = [];

        for (const target of targets) {
            const dir = capsule_dir(profile, target.id);
            const parsed = capsule_spec_schema.safeParse(
                await this.read_json(sandbox, `${dir}/capsule.json`),
            );
            if (!parsed.success) {
                warnings.push(
                    `${target.componentPath} was not previewed: its capsule description was missing or malformed`,
                );
                continue;
            }

            const entries = {
                base: await this.read_text(sandbox, `${dir}/base.tsx`),
                head: await this.read_text(sandbox, `${dir}/head.tsx`),
            };
            const problem = reject_split_fixture(entries);
            if (problem) {
                warnings.push(`${target.componentPath} was not previewed: ${problem}`);
                continue;
            }

            specs.push({
                id: target.id,
                title: parsed.data.title,
                componentPath: target.componentPath,
                change: target.change,
                viewport: parsed.data.viewport,
                controls: parsed.data.controls,
                entries: { base: entries.base !== null, head: entries.head !== null },
            });
        }

        log.info("capsules ready to build", { ready: specs.length, skipped: warnings.length });
        return { specs, warnings };
    }

    private static async read_text(sandbox: Sandbox, path: string): Promise<string | null> {
        return sandbox.files.read(path).catch(() => null);
    }

    private static async read_json(sandbox: Sandbox, path: string): Promise<unknown> {
        const raw = await this.read_text(sandbox, path);
        if (raw === null) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
}
