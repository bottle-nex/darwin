import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext } from "playwright";
import {
    capture_harness_root,
    open_browser,
    open_deterministic_context,
    settle_page,
} from "./browser";
import {
    PROBE_TARGET_ID,
    preview_url,
    type CapturedSide,
    type ShootInput,
    type ShootOutput,
    type ShotOutcome,
    type ShotResult,
    type Viewport,
} from "./contract";
import { diff_png } from "./image_diff";
import { read_harness_manifest } from "./scaffold";

const MAX_ERROR = 400;

interface Slot {
    targetId: string;
    stateId: string;
}

function absent(): CapturedSide {
    return { status: "absent", file: null, error: null };
}

function outcome_for(base: CapturedSide, head: CapturedSide): ShotOutcome {
    if (head.status === "ok" && base.status === "ok") return "Rendered";
    if (head.status === "ok") return "Added";
    if (base.status === "ok") return "Removed";
    return "Unavailable";
}

async function warm_up(
    context: BrowserContext,
    baseUrl: string,
    slots: Slot[],
    timeoutMs: number,
): Promise<void> {
    const page = await context.newPage();
    try {
        for (const slot of slots) {
            await page
                .goto(preview_url(baseUrl, slot.targetId, slot.stateId), {
                    waitUntil: "domcontentloaded",
                    timeout: timeoutMs,
                })
                .catch(() => undefined);
        }
    } finally {
        await page.close().catch(() => undefined);
    }
}

async function capture(
    context: BrowserContext,
    baseUrl: string,
    slot: Slot,
    destination: string,
    input: ShootInput,
): Promise<CapturedSide> {
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
        const response = await page.goto(preview_url(baseUrl, slot.targetId, slot.stateId), {
            waitUntil: "domcontentloaded",
            timeout: input.navigationTimeoutMs,
        });
        const status = response?.status() ?? 0;
        if (status >= 400) return { status: "failed", file: null, error: `HTTP ${status}` };

        await settle_page(page, input.settleMs);
        const png = await capture_harness_root(page);
        mkdirSync(join(destination, ".."), { recursive: true });
        writeFileSync(destination, png);

        return { status: "ok", file: null, error: null };
    } catch (error) {
        const message = [
            error instanceof Error ? error.message : String(error),
            ...pageErrors,
        ].join(" | ");
        return { status: "failed", file: null, error: message.slice(0, MAX_ERROR) };
    } finally {
        await page.close().catch(() => undefined);
    }
}

async function shoot_viewport(
    browser: Browser,
    input: ShootInput,
    viewport: Viewport,
    slots: Slot[],
): Promise<ShotResult[]> {
    const determinism = { frozenNowMs: input.frozenNowMs, randomSeed: input.randomSeed };
    const size = { width: viewport.width, height: viewport.height };

    const headContext = await open_deterministic_context(browser, size, determinism);
    const baseContext = input.revisions.base
        ? await open_deterministic_context(browser, size, determinism)
        : null;

    try {
        await warm_up(headContext, input.revisions.head, slots, input.warmupTimeoutMs);
        if (baseContext && input.revisions.base) {
            await warm_up(baseContext, input.revisions.base, slots, input.warmupTimeoutMs);
        }

        const results: ShotResult[] = [];
        for (const slot of slots) {
            const relativeDir = `${slot.targetId}/${slot.stateId}/${viewport.id}`;
            const absoluteDir = join(input.outputDir, relativeDir);
            mkdirSync(absoluteDir, { recursive: true });

            const head = await capture(
                headContext,
                input.revisions.head,
                slot,
                join(absoluteDir, "head.png"),
                input,
            );
            if (head.status === "ok") head.file = `${relativeDir}/head.png`;

            const base =
                baseContext && input.revisions.base
                    ? await capture(
                          baseContext,
                          input.revisions.base,
                          slot,
                          join(absoluteDir, "base.png"),
                          input,
                      )
                    : absent();
            if (base.status === "ok") base.file = `${relativeDir}/base.png`;

            const outcome = outcome_for(base, head);
            let diffFile: string | null = null;
            let diffPercentage: number | null = null;
            let error: string | null = head.error ?? base.error;

            if (outcome === "Rendered") {
                const result = await diff_png(
                    join(absoluteDir, "base.png"),
                    join(absoluteDir, "head.png"),
                    join(absoluteDir, "diff.png"),
                    input.diffThreshold,
                );
                if ("error" in result) {
                    error = result.error.slice(0, MAX_ERROR);
                } else {
                    diffPercentage = result.diffPercentage;
                    if (result.changed) diffFile = `${relativeDir}/diff.png`;
                }
            }

            results.push({
                targetId: slot.targetId,
                stateId: slot.stateId,
                viewportId: viewport.id,
                outcome,
                base,
                head,
                diffFile,
                diffPercentage,
                error,
            });
        }
        return results;
    } finally {
        await headContext.close().catch(() => undefined);
        await baseContext?.close().catch(() => undefined);
    }
}

/**
 * Photographs every target on both revisions and works out what changed.
 *
 * The base revision is optional on purpose. When the base dev server never came up, this still
 * ships head-only pictures and marks each shot as added, because half a preview is useful and a
 * failed row is not.
 *
 * @example
 * await shoot({ revisions: { head: "http://127.0.0.1:41337", base: "http://127.0.0.1:41338" }, ... });
 * // { ok: true, shots: [{ targetId: "header-nav", outcome: "Rendered", diffPercentage: 3.41, ... }] }
 */
export async function shoot(input: ShootInput): Promise<ShootOutput> {
    const manifest = read_harness_manifest(join(input.workspaceRoot, input.nextAppDir));
    const warnings: string[] = [];

    const allSlots: Slot[] = manifest.targets
        .filter((target) => target.id !== PROBE_TARGET_ID)
        .flatMap((target) =>
            target.states.map((state) => ({ targetId: target.id, stateId: state.id })),
        );

    const perViewport = Math.max(1, Math.floor(input.maxShots / input.viewports.length));
    const slots = allSlots.slice(0, perViewport);
    if (slots.length < allSlots.length) {
        warnings.push(
            `captured ${slots.length} of ${allSlots.length} target states to stay within the shot budget`,
        );
    }
    if (!input.revisions.base) {
        warnings.push("the base revision never started, so every target is reported as added");
    }
    if (slots.length === 0) {
        return { ok: false, shots: [], warnings: [...warnings, "no targets to capture"] };
    }

    mkdirSync(input.outputDir, { recursive: true });
    const browser = await open_browser();
    const shots: ShotResult[] = [];

    try {
        for (const viewport of input.viewports) {
            shots.push(...(await shoot_viewport(browser, input, viewport, slots)));
        }
    } finally {
        await browser.close().catch(() => undefined);
    }

    return { ok: shots.some((shot) => shot.outcome !== "Unavailable"), shots, warnings };
}
