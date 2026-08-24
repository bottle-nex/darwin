import { join } from "node:path";
import type { Browser, Locator, Request } from "playwright";
import { open_browser, open_deterministic_context, settle_page } from "./browser";
import {
    HARNESS_ROOT_ATTRIBUTE,
    PROBE_TARGET_ID,
    preview_url,
    type CheckInput,
    type CheckOutput,
    type CheckProblem,
    type CheckResult,
} from "./contract";
import { read_harness_manifest } from "./scaffold";

const CHECK_VIEWPORT = { width: 1280, height: 800 };
const MAX_DETAIL = 2000;
const DETERMINISM = { frozenNowMs: 1_750_000_000_000, randomSeed: 1 };

function fail(
    targetId: string,
    stateId: string,
    url: string,
    problem: CheckProblem,
    detail: string,
    httpStatus: number | null,
): CheckResult {
    return {
        targetId,
        stateId,
        url,
        ok: false,
        httpStatus,
        problem,
        detail: detail.slice(0, MAX_DETAIL),
    };
}

export async function next_error_overlay_detail(
    portal: Pick<Locator, "evaluate">,
): Promise<string> {
    return portal
        .evaluate(
            (element) =>
                element.shadowRoot?.textContent?.trim() || element.textContent?.trim() || "",
        )
        .catch(() => "");
}

function request_redirected(request: Request): boolean {
    return request.redirectedFrom() !== null;
}

function expected_navigation(url: string, finalUrl: string): boolean {
    const expected = new URL(url);
    const received = new URL(finalUrl);
    return (
        expected.origin === received.origin &&
        expected.pathname === received.pathname &&
        expected.search === received.search &&
        expected.hash === received.hash
    );
}

async function check_one(
    browser: Browser,
    baseUrl: string,
    routePath: string,
    targetId: string,
    stateId: string,
    navigationTimeoutMs: number,
): Promise<CheckResult> {
    const url = preview_url(baseUrl, routePath, targetId, stateId);
    const context = await open_deterministic_context(browser, CHECK_VIEWPORT, DETERMINISM);
    const page = await context.newPage();
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message));
    page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
    });

    try {
        const response = await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: navigationTimeoutMs,
        });
        const httpStatus = response?.status() ?? null;

        if (response && request_redirected(response.request())) {
            return fail(
                targetId,
                stateId,
                url,
                "Redirected",
                `navigation followed an HTTP redirect before ending at ${page.url()}`,
                httpStatus,
            );
        }
        if (httpStatus === null || httpStatus >= 400) {
            const body = await page.content().catch(() => "");
            return fail(
                targetId,
                stateId,
                url,
                "HttpError",
                `HTTP ${httpStatus}\n${body}`,
                httpStatus,
            );
        }
        if (!expected_navigation(url, page.url())) {
            return fail(
                targetId,
                stateId,
                url,
                "Redirected",
                `navigation ended at ${page.url()} — middleware or a redirect moved it away`,
                httpStatus,
            );
        }

        await settle_page(page, 150);

        if (!expected_navigation(url, page.url())) {
            return fail(
                targetId,
                stateId,
                url,
                "Redirected",
                `navigation changed during page settling and ended at ${page.url()}`,
                httpStatus,
            );
        }

        if (pageErrors.length > 0) {
            return fail(targetId, stateId, url, "PageError", pageErrors.join("\n\n"), httpStatus);
        }

        const portal = page.locator("nextjs-portal");
        const overlay = (await portal.count()) > 0 ? await next_error_overlay_detail(portal) : "";
        if (overlay) {
            return fail(targetId, stateId, url, "NextErrorOverlay", overlay, httpStatus);
        }
        if (consoleErrors.length > 0) {
            return fail(
                targetId,
                stateId,
                url,
                "ConsoleError",
                consoleErrors.join("\n\n"),
                httpStatus,
            );
        }

        const root = page.locator(`[${HARNESS_ROOT_ATTRIBUTE}]`).first();
        if ((await root.count()) === 0) {
            return fail(
                targetId,
                stateId,
                url,
                "MissingRoot",
                "the harness wrapper never rendered",
                httpStatus,
            );
        }

        const box = await root.boundingBox();
        if (!box || box.width <= 0 || box.height <= 0) {
            return fail(
                targetId,
                stateId,
                url,
                "EmptyRoot",
                "the target rendered nothing with size — it may return null for this state",
                httpStatus,
            );
        }

        return {
            targetId,
            stateId,
            url,
            ok: true,
            httpStatus,
            problem: null,
            detail: null,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const problem: CheckProblem = message.toLowerCase().includes("timeout")
            ? "Timeout"
            : "PageError";
        const detail = [message, ...pageErrors].join("\n\n");
        return fail(targetId, stateId, url, problem, detail, null);
    } finally {
        await context.close().catch(() => undefined);
    }
}

/**
 * Mounts every target in a real browser and reports exactly why any of them failed.
 *
 * This is the harness agent's oracle. It cannot be satisfied by writing convincing-looking code —
 * only by code that a browser actually renders — which is what stops the agent drifting back into
 * drawing the UI instead of mounting it.
 *
 * @example
 * await check({ baseUrl: "http://127.0.0.1:41337", workspaceRoot, nextAppDir: "apps/web", navigationTimeoutMs: 45000 });
 * // { ok: false, results: [{ targetId: "header-nav", problem: "PageError", detail: "TypeError: ..." }] }
 */
export async function check(input: CheckInput): Promise<CheckOutput> {
    const manifest = read_harness_manifest(join(input.workspaceRoot, input.nextAppDir));
    const wanted = input.targetIds;
    const targets = manifest.targets.filter((target) => !wanted || wanted.includes(target.id));

    const browser = await open_browser();
    const results: CheckResult[] = [];

    try {
        results.push(
            await check_one(
                browser,
                input.baseUrl,
                input.routePath,
                PROBE_TARGET_ID,
                "default",
                input.navigationTimeoutMs,
            ),
        );
        for (const target of targets) {
            for (const state of target.states) {
                results.push(
                    await check_one(
                        browser,
                        input.baseUrl,
                        input.routePath,
                        target.id,
                        state.id,
                        input.navigationTimeoutMs,
                    ),
                );
            }
        }
    } finally {
        await browser.close().catch(() => undefined);
    }

    const warnings = results.flatMap((result) =>
        result.ok && result.detail
            ? [`${result.targetId}/${result.stateId}: ${result.detail}`]
            : [],
    );
    return { ok: results.every((result) => result.ok), results, warnings };
}
