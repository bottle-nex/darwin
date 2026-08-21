import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { HARNESS_ROOT_ATTRIBUTE } from "./contract";

const LAUNCH_ARGS = [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--force-color-profile=srgb",
    "--font-render-hinting=none",
    "--disable-lcd-text",
    "--hide-scrollbars",
    "--disable-features=IsolateOrigins,site-per-process",
];
const TRANSPARENT_PIXEL = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
);
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "0.0.0.0"]);
const QUIET_STYLES = `*, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
}
html { scrollbar-width: none !important; }
::-webkit-scrollbar { display: none !important; }
[data-next-badge-root], nextjs-portal { display: none !important; }`;

export interface DeterminismOptions {
    frozenNowMs: number;
    randomSeed: number;
}

function determinism_script(options: DeterminismOptions): string {
    return `(() => {
    const FIXED = ${options.frozenNowMs};
    const NativeDate = Date;
    class FrozenDate extends NativeDate {
        constructor(...args) {
            if (args.length === 0) super(FIXED);
            else super(...args);
        }
        static now() { return FIXED; }
    }
    globalThis.Date = FrozenDate;

    let seed = ${options.randomSeed} >>> 0;
    Math.random = () => {
        seed = (seed + 0x6d2b79f5) >>> 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    if (globalThis.performance) globalThis.performance.now = () => 0;

    let uuidCounter = 0;
    if (globalThis.crypto) {
        globalThis.crypto.randomUUID = () => {
            uuidCounter += 1;
            return "00000000-0000-4000-8000-" + String(uuidCounter).padStart(12, "0");
        };
    }
})();`;
}

/**
 * Starts one headless Chromium for the whole run.
 *
 * `--no-sandbox` is required rather than optional: E2B runs sandboxes inside a microVM that
 * gives Chromium no usable user namespaces, and without the flag it refuses to start at all.
 *
 * @example
 * const browser = await open_browser();
 * try { ... } finally { await browser.close(); }
 */
export async function open_browser(): Promise<Browser> {
    return chromium.launch({ args: LAUNCH_ARGS });
}

/**
 * Opens a browsing context where the same code always paints the same pixels.
 *
 * Freezes the clock, seeds randomness, forces UTC and a fixed locale, and refuses every request
 * that is not the local dev server — so a diff can only come from the code, never from a slow
 * font download or a second ticking over between two shots.
 *
 * @example
 * const context = await open_deterministic_context(browser, { width: 1280, height: 800 }, { frozenNowMs: 1750000000000, randomSeed: 1 });
 */
export async function open_deterministic_context(
    browser: Browser,
    viewport: { width: number; height: number },
    options: DeterminismOptions,
): Promise<BrowserContext> {
    const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        colorScheme: "light",
        reducedMotion: "reduce",
        timezoneId: "UTC",
        locale: "en-US",
        javaScriptEnabled: true,
    });

    await context.addInitScript(determinism_script(options));

    await context.route("**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());

        if (url.protocol === "data:" || url.protocol === "blob:") return route.continue();
        if (LOOPBACK_HOSTS.has(url.hostname)) return route.continue();

        if (request.resourceType() === "image" || request.resourceType() === "font") {
            return route.fulfill({
                status: 200,
                contentType: "image/png",
                body: TRANSPARENT_PIXEL,
            });
        }
        return route.abort();
    });

    return context;
}

/**
 * Waits until a loaded page has stopped moving, so a screenshot cannot catch it mid-render.
 *
 * Fonts are the usual culprit: text laid out in a fallback face and then reflowed a moment later
 * shifts every line, which reads as a huge diff that no code change caused.
 *
 * @example
 * await settle_page(page, 250);
 */
export async function settle_page(page: Page, settleMs: number): Promise<void> {
    await page.addStyleTag({ content: QUIET_STYLES }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    await page.evaluate(() => document.fonts.ready).catch(() => undefined);
    await page.waitForTimeout(settleMs);
}

/**
 * Photographs just the harness wrapper, not the whole page.
 *
 * Targets render inside the app's real root layout, so the page also contains that layout's navbar
 * and footer. Cropping to the wrapper keeps the real styling while leaving the surrounding
 * furniture out of the picture.
 *
 * @example
 * const png = await capture_harness_root(page);
 */
export async function capture_harness_root(page: Page): Promise<Buffer> {
    return page
        .locator(`[${HARNESS_ROOT_ATTRIBUTE}]`)
        .first()
        .screenshot({ animations: "disabled", caret: "hide", scale: "css" });
}
