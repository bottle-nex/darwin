import { chromium, type Page } from "playwright";

import {
    type GateResult,
    grade_page,
    MOUNT_WAIT_MS,
    PAGE_TIMEOUT_MS,
    type PageObservation,
} from "./gates";
import { serve_directory } from "./server";

const VIEWPORT = { width: 1280, height: 900 };

interface PageSignals {
    pageErrors: string[];
    consoleErrors: string[];
    failedRequests: string[];
}

function listen(page: Page): PageSignals {
    const signals: PageSignals = { pageErrors: [], consoleErrors: [], failedRequests: [] };

    page.on("pageerror", (error) => signals.pageErrors.push(error.message));
    page.on("console", (message) => {
        if (message.type() === "error") signals.consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
        signals.failedRequests.push(`${request.method()} ${request.url()} failed`);
    });

    return signals;
}

async function measure(page: Page): Promise<Omit<PageObservation, keyof PageSignals | "mounted" | "timedOut">> {
    return page.evaluate(() => {
        const root = document.getElementById("root");
        if (!root) return { renderedHeight: 0, visibleTextLength: 0, imageCount: 0 };

        const box = root.getBoundingClientRect();
        return {
            renderedHeight: Math.round(box.height),
            visibleTextLength: (root.innerText ?? "").trim().length,
            imageCount: root.querySelectorAll("img, svg, canvas, video").length,
        };
    });
}

export async function check_capsule(
    origin: string,
    capsule_id: string,
    page: Page,
): Promise<GateResult> {
    const signals = listen(page);
    let timed_out = false;
    let mounted = false;

    try {
        await page.goto(`${origin}/${capsule_id}/index.html`, {
            timeout: PAGE_TIMEOUT_MS,
            waitUntil: "load",
        });
        await page.waitForFunction(
            () => (document.getElementById("root")?.childElementCount ?? 0) > 0,
            undefined,
            { timeout: MOUNT_WAIT_MS },
        );
        mounted = true;
    } catch (error) {
        timed_out = String(error).includes("Timeout");
    }

    const measured = mounted
        ? await measure(page).catch(() => ({
              renderedHeight: 0,
              visibleTextLength: 0,
              imageCount: 0,
          }))
        : { renderedHeight: 0, visibleTextLength: 0, imageCount: 0 };

    return grade_page(capsule_id, { mounted, timedOut: timed_out, ...signals, ...measured });
}

async function main(): Promise<void> {
    const [dist_dir, capsule_ids_json] = process.argv.slice(2);
    if (!dist_dir || !capsule_ids_json) {
        console.error("usage: capsule-check <distDir> <capsuleIdsJson>");
        process.exit(2);
    }

    const capsule_ids = JSON.parse(capsule_ids_json) as string[];
    const site = await serve_directory(dist_dir);
    const browser = await chromium.launch({ args: ["--no-sandbox"] });

    try {
        for (const capsule_id of capsule_ids) {
            const context = await browser.newContext({ viewport: VIEWPORT });
            const page = await context.newPage();
            const result = await check_capsule(site.origin, capsule_id, page);
            console.log(JSON.stringify(result));
            await context.close();
        }
    } finally {
        await browser.close();
        await site.close();
    }
}

await main();
