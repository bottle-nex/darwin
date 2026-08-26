import { posix } from "node:path";

import type { Sandbox } from "e2b";

import type { ProductDiffReplayBrowserAsset } from "../../adapter.contract";

const CONTENT_TYPES = new Map<string, string>([
    [".avif", "image/avif"],
    [".css", "text/css"],
    [".gif", "image/gif"],
    [".html", "text/html"],
    [".ico", "image/x-icon"],
    [".jpeg", "image/jpeg"],
    [".jpg", "image/jpeg"],
    [".js", "application/javascript"],
    [".json", "application/json"],
    [".map", "application/json"],
    [".mjs", "application/javascript"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".txt", "text/plain"],
    [".wasm", "application/wasm"],
    [".webmanifest", "application/manifest+json"],
    [".webp", "image/webp"],
    [".woff", "font/woff"],
    [".woff2", "font/woff2"],
    [".xml", "application/xml"],
]);

function shell_argument(value: string): string {
    if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
    return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function is_descendant(root: string, candidate: string): boolean {
    const relative = posix.relative(root, candidate);
    return relative !== "" && relative !== ".." && !relative.startsWith("../");
}

function browser_asset(
    sourcePath: string,
    staticRoot: string,
    publicRoot: string,
): ProductDiffReplayBrowserAsset | null {
    let requestPath: string;
    if (is_descendant(staticRoot, sourcePath)) {
        requestPath = `/_next/static/${posix.relative(staticRoot, sourcePath)}`;
    } else if (is_descendant(publicRoot, sourcePath)) {
        requestPath = `/${posix.relative(publicRoot, sourcePath)}`;
    } else {
        return null;
    }

    return {
        requestPath,
        sourcePath,
        contentType:
            CONTENT_TYPES.get(posix.extname(sourcePath).toLowerCase()) ??
            "application/octet-stream",
    };
}

export async function collect_next_replay_assets(
    sandbox: Sandbox,
    applicationRoot: string,
): Promise<ProductDiffReplayBrowserAsset[]> {
    const normalizedApplicationRoot = posix.resolve(applicationRoot);
    const staticRoot = posix.join(normalizedApplicationRoot, ".next/static");
    const publicRoot = posix.join(normalizedApplicationRoot, "public");
    const result = await sandbox.commands.run(
        `find -P ${shell_argument(staticRoot)} ${shell_argument(publicRoot)} -type f -print0 2>/dev/null || true`,
    );
    const assets = result.stdout
        .split("\0")
        .filter(Boolean)
        .map((sourcePath) => browser_asset(posix.resolve(sourcePath), staticRoot, publicRoot))
        .filter((asset): asset is ProductDiffReplayBrowserAsset => asset !== null);

    return assets.sort((left, right) =>
        left.requestPath === right.requestPath
            ? left.sourcePath.localeCompare(right.sourcePath)
            : left.requestPath.localeCompare(right.requestPath),
    );
}
