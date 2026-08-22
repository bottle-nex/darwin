import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BrowserContext, Page } from "playwright";
import { open_browser, open_deterministic_context, settle_page } from "./browser";
import {
    HARNESS_ROOT_ATTRIBUTE,
    PROBE_TARGET_ID,
    preview_url,
    type CaptureInput,
    type CaptureOutput,
    type CaptureResult,
    type Viewport,
} from "./contract";
import { read_harness_manifest } from "./scaffold";

const MAX_ERROR = 400;

interface Slot {
    targetId: string;
    stateId: string;
}

export async function capture_problem(
    page: Pick<Page, "locator">,
    pageErrors: string[],
): Promise<string | null> {
    const root = page.locator(`[${HARNESS_ROOT_ATTRIBUTE}]`).first();
    if ((await root.count()) === 0) return "MissingRoot";

    const box = await root.boundingBox();
    if (!box || box.width <= 0 || box.height <= 0) return "EmptyRoot";
    return pageErrors[0] ?? null;
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

async function capture_one(
    context: BrowserContext,
    input: CaptureInput,
    slot: Slot,
    viewport: Viewport,
): Promise<CaptureResult> {
    const relativeDir = `${slot.targetId}/${slot.stateId}/${viewport.id}`;
    const absoluteDir = join(input.outputDir, relativeDir);
    mkdirSync(absoluteDir, { recursive: true });

    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const base: Omit<CaptureResult, "status" | "file" | "error"> = {
        targetId: slot.targetId,
        stateId: slot.stateId,
        viewportId: viewport.id,
    };

    try {
        const response = await page.goto(preview_url(input.url, slot.targetId, slot.stateId), {
            waitUntil: "domcontentloaded",
            timeout: input.navigationTimeoutMs,
        });
        const status = response?.status() ?? 0;
        if (!response || status >= 400) {
            return { ...base, status: "failed", file: null, error: `HTTP ${status}` };
        }

        await settle_page(page, input.settleMs);
        const problem = await capture_problem(page, pageErrors);
        if (problem) return { ...base, status: "failed", file: null, error: problem };
        writeFileSync(
            join(absoluteDir, `${input.side}.png`),
            await page
                .locator(`[${HARNESS_ROOT_ATTRIBUTE}]`)
                .first()
                .screenshot({ animations: "disabled", caret: "hide", scale: "css" }),
        );

        return { ...base, status: "ok", file: `${relativeDir}/${input.side}.png`, error: null };
    } catch (error) {
        const message = [
            error instanceof Error ? error.message : String(error),
            ...pageErrors,
        ].join(" | ");
        return { ...base, status: "failed", file: null, error: message.slice(0, MAX_ERROR) };
    } finally {
        await page.close().catch(() => undefined);
    }
}

/**
 * Photographs one revision of the app and writes a PNG per target, state and screen size.
 *
 * Only one revision at a time, on purpose. Two Next.js dev servers compiling a real app at once
 * need more memory than a sandbox usually has, and the kernel kills one of them. Capturing the
 * revisions one after the other halves the peak memory the preview ever needs.
 *
 * @example
 * await capture({ url: "http://127.0.0.1:41337", side: "head", ... });
 * // writes header-nav/default/desktop/head.png
 */
export async function capture(input: CaptureInput): Promise<CaptureOutput> {
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
    if (slots.length === 0) {
        return {
            ok: false,
            side: input.side,
            captures: [],
            warnings: [...warnings, "no targets to capture"],
        };
    }

    mkdirSync(input.outputDir, { recursive: true });
    const browser = await open_browser();
    const captures: CaptureResult[] = [];

    try {
        for (const viewport of input.viewports) {
            const context = await open_deterministic_context(
                browser,
                { width: viewport.width, height: viewport.height },
                { frozenNowMs: input.frozenNowMs, randomSeed: input.randomSeed },
            );
            try {
                await warm_up(context, input.url, slots, input.warmupTimeoutMs);
                for (const slot of slots) {
                    captures.push(await capture_one(context, input, slot, viewport));
                }
            } finally {
                await context.close().catch(() => undefined);
            }
        }
    } finally {
        await browser.close().catch(() => undefined);
    }

    return {
        ok: captures.some((shot) => shot.status === "ok"),
        side: input.side,
        captures,
        warnings,
    };
}
