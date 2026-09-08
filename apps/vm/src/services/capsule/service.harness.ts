import type { Sandbox } from "e2b";

import type { CapsuleSpec } from "./service.author";
import type { AppProfile } from "./service.workspace";

const REPO_DIR = "/home/user/repo";

export const GLOBAL_CSS_ALIAS = "@darwin/global.css";

export function app_root(profile: AppProfile): string {
    return profile.appDir === "." ? REPO_DIR : `${REPO_DIR}/${profile.appDir}`;
}

export function harness_dir(profile: AppProfile): string {
    return `${app_root(profile)}/.darwin/harness`;
}

export function capsules_dir(profile: AppProfile): string {
    return `${app_root(profile)}/.darwin/capsules`;
}

export type CapsuleRevision = "base" | "head";

export interface HarnessOptions {
    tailwindConfigPath: string | null;
}

const DEFAULT_OPTIONS: HarnessOptions = { tailwindConfigPath: null };

export function harness_dependencies(profile: AppProfile): string[] {
    const packages = [
        "vite@^7",
        "@vitejs/plugin-react@^5",
        "vite-plugin-singlefile@^2",
        "vite-tsconfig-paths@^5",
    ];
    if (profile.tailwindMajor === 4) packages.push("@tailwindcss/vite@^4");
    if (profile.tailwindMajor === 3)
        packages.push("tailwindcss@^3", "postcss@^8", "autoprefixer@^10");
    return packages;
}

export function capsule_alias(capsule_id: string): string {
    return `@capsule/${capsule_id}`;
}

export function resolve_aliases(
    profile: AppProfile,
    capsules: { ids: string[]; revision: CapsuleRevision } = { ids: [], revision: "head" },
): Record<string, string> {
    const aliases: Record<string, string> = {};
    const harness = harness_dir(profile);
    aliases["next/image"] = `${harness}/shims/next-image.tsx`;
    aliases["next/link"] = `${harness}/shims/next-link.tsx`;
    aliases["next/navigation"] = `${harness}/shims/next-navigation.ts`;
    aliases["next/dynamic"] = `${harness}/shims/next-dynamic.tsx`;
    aliases["next/script"] = `${harness}/shims/next-script.tsx`;
    aliases["next/head"] = `${harness}/shims/next-head.tsx`;
    aliases["next/router"] = `${harness}/shims/next-router.ts`;
    aliases["next/cache"] = `${harness}/shims/next-cache.ts`;
    aliases["server-only"] = `${harness}/shims/passthrough.ts`;
    aliases["client-only"] = `${harness}/shims/passthrough.ts`;

    if (profile.globalCssPath) {
        aliases[GLOBAL_CSS_ALIAS] = `${harness}/global.css`;
    }

    for (const id of capsules.ids) {
        aliases[capsule_alias(id)] = `${capsules_dir(profile)}/${id}/${capsules.revision}.tsx`;
    }

    return aliases;
}

export function render_vite_config(
    profile: AppProfile,
    capsule_id: string,
    options: HarnessOptions = DEFAULT_OPTIONS,
    revision: CapsuleRevision = "head",
): string {
    const aliases = resolve_aliases(profile, { ids: [capsule_id], revision });
    const harness = harness_dir(profile);
    const input = `${harness}/pages/${capsule_id}/index.html`;

    const tailwind_import =
        profile.tailwindMajor === 4 ? 'import tailwindcss from "@tailwindcss/vite";\n' : "";
    const tailwind_plugin = profile.tailwindMajor === 4 ? ", tailwindcss()" : "";
    const postcss =
        profile.tailwindMajor === 3
            ? `    css: {
        postcss: {
            plugins: [
                (await import("tailwindcss")).default(${
                    options.tailwindConfigPath
                        ? `{ config: ${JSON.stringify(options.tailwindConfigPath)} }`
                        : ""
                }),
                (await import("autoprefixer")).default(),
            ],
        },
    },
`
            : "";

    return `import react from "@vitejs/plugin-react";
${tailwind_import}import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import tsconfigPaths from "vite-tsconfig-paths";

import overrides from "./darwin.overrides";

${FONT_TRANSFORM_PLUGIN}

export default defineConfig({
    root: ${JSON.stringify(`${harness}/pages`)},
    base: "./",
    plugins: [
        nextFontShim,
        tsconfigPaths({ root: ${JSON.stringify(app_root(profile))} }),
        react()${tailwind_plugin},
        viteSingleFile(),
    ],
    resolve: {
        alias: { ...${JSON.stringify(aliases, null, 8).replace(/\n}/, "\n        }")}, ...overrides.aliases },
        dedupe: ["react", "react-dom"],
    },
${postcss}    server: {
        fs: { allow: [${JSON.stringify(REPO_DIR)}] },
    },
    build: {
        emptyOutDir: false,
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        cssCodeSplit: false,
        rollupOptions: {
            input: ${JSON.stringify(input)},
            external: overrides.external,
        },
    },
});
`;
}

export const OVERRIDES_FILE = "darwin.overrides.ts";

/**
 * The one file in the harness the repair agent owns.
 *
 * Everything else here is regenerated before every build, so a fix written into the generated
 * config is deleted seconds after it works. Resolution problems belong to the project rather than
 * to a capsule entry, and this is where they can be answered and survive.
 */
export const OVERRIDES_TEMPLATE = `export default {
    aliases: {} as Record<string, string>,
    external: [] as string[],
};
`;

export function render_global_css(profile: AppProfile): string {
    const stylesheet = `${REPO_DIR}/${profile.globalCssPath}`;
    return `@import ${JSON.stringify(stylesheet)};
@source "../../";
`;
}

const FONT_TRANSFORM_PLUGIN = `const FONT_FACE = '{ className: "", variable: "", style: { fontFamily: "inherit" } }';
const FONT_IMPORT = /import\\s+([^;]+?)\\s+from\\s+["']next\\/font\\/(?:google|local)["'];?/g;

function fontDeclarations(clause) {
    const names = [];
    const fallback = clause.replace(/\\{[^}]*\\}/g, "").replace(/,/g, "").trim();
    if (fallback) names.push(fallback);

    const braced = clause.match(/\\{([^}]*)\\}/);
    for (const part of (braced ? braced[1] : "").split(",")) {
        const local = part.trim().split(/\\s+as\\s+/).pop()?.trim();
        if (local) names.push(local);
    }

    return names
        .filter((name) => /^[A-Za-z_$][\\w$]*$/.test(name))
        .map((name) => "const " + name + " = () => (" + FONT_FACE + ");")
        .join(" ");
}

const nextFontShim = {
    name: "darwin:next-font",
    enforce: "pre",
    transform(code, id) {
        if (!id.match(/\\.[jt]sx?$/) || !code.includes("next/font")) return null;
        const out = code.replace(FONT_IMPORT, (_match, clause) => fontDeclarations(clause));
        return out === code ? null : { code: out, map: null };
    },
};`;

export function render_page_html(spec: CapsuleSpec): string {
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${spec.title}</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="./main.tsx"></script>
    </body>
</html>
`;
}

export function render_page_entry(spec: CapsuleSpec, profile: AppProfile): string {
    const global_css = profile.globalCssPath ? `import ${JSON.stringify(GLOBAL_CSS_ALIAS)};\n` : "";

    return `import "../../network-stub";
${global_css}
import { createRoot } from "react-dom/client";

import Capsule from ${JSON.stringify(capsule_alias(spec.id))};

const container = document.getElementById("root");

if (container) {
    const root = createRoot(container);
    const read = () => Object.fromEntries(new URLSearchParams(window.location.hash.slice(1)));
    const paint = () => root.render(<Capsule controls={read()} />);

    window.addEventListener("hashchange", paint);
    paint();
}
`;
}

const NETWORK_STUB = `const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
    });

window.fetch = async () => json([]);

class OfflineXhr {
    status = 200;
    readyState = 4;
    response = "[]";
    responseText = "[]";
    onload: (() => void) | null = null;
    onreadystatechange: (() => void) | null = null;
    open() {}
    abort() {}
    setRequestHeader() {}
    getAllResponseHeaders() {
        return "";
    }
    addEventListener(name: string, handler: () => void) {
        if (name === "load") this.onload = handler;
    }
    removeEventListener() {}
    send() {
        queueMicrotask(() => {
            this.onreadystatechange?.();
            this.onload?.();
        });
    }
}

class OfflineSocket {
    readyState = 3;
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
}

window.XMLHttpRequest = OfflineXhr as unknown as typeof XMLHttpRequest;
window.WebSocket = OfflineSocket as unknown as typeof WebSocket;

if ("sendBeacon" in navigator) navigator.sendBeacon = () => true;

export {};
`;

const NEXT_IMAGE_SHIM = `import type { ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
    src?: string | { src: string };
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    placeholder?: string;
    blurDataURL?: string;
    loader?: unknown;
    unoptimized?: boolean;
};

export default function Image({
    src,
    fill,
    priority,
    quality,
    placeholder,
    blurDataURL,
    loader,
    unoptimized,
    style,
    ...rest
}: Props) {
    const resolved = typeof src === "object" && src !== null ? src.src : src;
    const fillStyle = fill ? { position: "absolute" as const, inset: 0, objectFit: "cover" as const } : null;
    return <img src={resolved} style={{ ...fillStyle, ...style }} {...rest} />;
}
`;

const NEXT_LINK_SHIM = `import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href?: string | { pathname?: string };
    children?: ReactNode;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
};

export default function Link({ href, children, prefetch, replace, scroll, shallow, ...rest }: Props) {
    const resolved = typeof href === "object" && href !== null ? (href.pathname ?? "#") : (href ?? "#");
    return (
        <a href={resolved} {...rest}>
            {children}
        </a>
    );
}
`;

const NEXT_NAVIGATION_SHIM = `const noop = () => {};

export function useRouter() {
    return {
        push: noop,
        replace: noop,
        refresh: noop,
        back: noop,
        forward: noop,
        prefetch: noop,
    };
}

export function usePathname() {
    return "/";
}

export function useSearchParams() {
    return new URLSearchParams(window.location.search);
}

export function useParams() {
    return {};
}

export function redirect() {}
export function notFound() {}
`;

const NEXT_DYNAMIC_SHIM = `import { lazy, Suspense } from "react";

export default function dynamic(loader, options = {}) {
    const Loaded = lazy(() =>
        Promise.resolve(loader()).then((module) =>
            module && typeof module === "object" && "default" in module
                ? module
                : { default: module },
        ),
    );
    const fallback = options.loading ? options.loading() : null;

    return function Dynamic(props) {
        return (
            <Suspense fallback={fallback}>
                <Loaded {...props} />
            </Suspense>
        );
    };
}
`;

const NEXT_SCRIPT_SHIM = `export default function Script() {
    return null;
}
`;

const NEXT_HEAD_SHIM = `export default function Head() {
    return null;
}
`;

const NEXT_ROUTER_SHIM = `const noop = () => {};

export function useRouter() {
    return {
        pathname: "/",
        route: "/",
        query: {},
        asPath: "/",
        push: noop,
        replace: noop,
        reload: noop,
        back: noop,
        prefetch: () => Promise.resolve(),
        events: { on: noop, off: noop, emit: noop },
    };
}

export default { useRouter };
`;

const NEXT_CACHE_SHIM = `export function revalidatePath() {}
export function revalidateTag() {}
export function unstable_cache(fn) {
    return fn;
}
`;

const PASSTHROUGH_SHIM = `export {};
`;

export function harness_files(): Record<string, string> {
    return {
        "network-stub.ts": NETWORK_STUB,
        "shims/next-image.tsx": NEXT_IMAGE_SHIM,
        "shims/next-link.tsx": NEXT_LINK_SHIM,
        "shims/next-navigation.ts": NEXT_NAVIGATION_SHIM,
        "shims/next-dynamic.tsx": NEXT_DYNAMIC_SHIM,
        "shims/next-script.tsx": NEXT_SCRIPT_SHIM,
        "shims/next-head.tsx": NEXT_HEAD_SHIM,
        "shims/next-router.ts": NEXT_ROUTER_SHIM,
        "shims/next-cache.ts": NEXT_CACHE_SHIM,
        "shims/passthrough.ts": PASSTHROUGH_SHIM,
    };
}

export default class CapsuleHarness {
    public static async write(
        sandbox: Sandbox,
        profile: AppProfile,
        specs: CapsuleSpec[],
        revision: CapsuleRevision,
    ): Promise<string[]> {
        const buildable = specs.filter((spec) => spec.entries[revision]);

        const harness = harness_dir(profile);
        await sandbox.commands.run(`rm -rf ${harness}/pages && mkdir -p ${harness}/shims`);

        for (const [name, contents] of Object.entries(harness_files())) {
            await sandbox.files.write(`${harness}/${name}`, contents);
        }

        const overrides = `${harness}/${OVERRIDES_FILE}`;
        const kept = await sandbox.files.read(overrides).catch(() => null);
        if (kept === null) await sandbox.files.write(overrides, OVERRIDES_TEMPLATE);
        if (profile.globalCssPath) {
            await sandbox.files.write(`${harness}/global.css`, render_global_css(profile));
        }

        for (const spec of buildable) {
            const page = `${harness}/pages/${spec.id}`;
            await sandbox.files.write(`${page}/index.html`, render_page_html(spec));
            await sandbox.files.write(`${page}/main.tsx`, render_page_entry(spec, profile));
        }

        return buildable.map((spec) => spec.id);
    }

    public static async write_config(
        sandbox: Sandbox,
        profile: AppProfile,
        capsule_id: string,
        revision: CapsuleRevision,
    ): Promise<void> {
        const options = await this.detect(sandbox, profile);
        await sandbox.files.write(
            `${harness_dir(profile)}/vite.config.ts`,
            render_vite_config(profile, capsule_id, options, revision),
        );
    }

    public static async install(sandbox: Sandbox, profile: AppProfile): Promise<void> {
        await sandbox.commands.run(`mkdir -p ${harness_dir(profile)}`);
        await sandbox.files.write(
            `${harness_dir(profile)}/package.json`,
            `${JSON.stringify({ name: "darwin-capsule-harness", private: true, type: "module" }, null, 4)}\n`,
        );
        await sandbox.commands.run(
            `npm install --no-audit --no-fund ${harness_dependencies(profile).join(" ")}`,
            { cwd: harness_dir(profile), timeoutMs: 6 * 60_000 },
        );
    }

    private static async detect(sandbox: Sandbox, profile: AppProfile): Promise<HarnessOptions> {
        const tailwind_config =
            profile.tailwindMajor === 3
                ? await sandbox.commands
                      .run(
                          `find ${app_root(profile)} -maxdepth 2 -name 'tailwind.config.*' -not -path '*/node_modules/*' | head -1`,
                      )
                      .then((result) => result.stdout.trim() || null)
                      .catch(() => null)
                : null;

        return { tailwindConfigPath: tailwind_config };
    }
}
