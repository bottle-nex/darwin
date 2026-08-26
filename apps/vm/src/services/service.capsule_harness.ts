import type { Sandbox } from "e2b";

import type { CapsuleSpec } from "./service.capsule_author";
import type { AppProfile } from "./service.capsule_workspace";

const REPO_DIR = "/home/user/repo";

export const GLOBAL_CSS_ALIAS = "@matcha/global.css";

export function app_root(profile: AppProfile): string {
    return profile.appDir === "." ? REPO_DIR : `${REPO_DIR}/${profile.appDir}`;
}

export function harness_dir(profile: AppProfile): string {
    return `${app_root(profile)}/.matcha/harness`;
}

export function capsules_dir(profile: AppProfile): string {
    return `${app_root(profile)}/.matcha/capsules`;
}

export type CapsuleRevision = "base" | "head";

export interface HarnessOptions {
    tailwindConfigPath: string | null;
}

const DEFAULT_OPTIONS: HarnessOptions = { tailwindConfigPath: null };

export function harness_dependencies(profile: AppProfile): string[] {
    const packages = ["vite@^7", "@vitejs/plugin-react@^5"];
    if (profile.tailwindMajor === 4) packages.push("@tailwindcss/vite@^4");
    if (profile.tailwindMajor === 3) packages.push("tailwindcss@^3", "postcss@^8", "autoprefixer@^10");
    return packages;
}

export function capsule_alias(capsule_id: string): string {
    return `@capsule/${capsule_id}`;
}

export function resolve_aliases(
    profile: AppProfile,
    options: HarnessOptions = DEFAULT_OPTIONS,
    capsules: { ids: string[]; revision: CapsuleRevision } = { ids: [], revision: "head" },
): Record<string, string> {
    const aliases: Record<string, string> = {};

    for (const [pattern, targets] of Object.entries(profile.tsconfigPaths)) {
        const target = targets[0];
        if (!target) continue;
        const key = pattern.replace(/\/\*$/, "");
        const value = target.replace(/\/\*$/, "").replace(/^\.\/?/, "");
        aliases[key] = value ? `${app_root(profile)}/${value}` : app_root(profile);
    }

    const harness = harness_dir(profile);
    aliases["next/image"] = `${harness}/shims/next-image.tsx`;
    aliases["next/link"] = `${harness}/shims/next-link.tsx`;
    aliases["next/font/google"] = `${harness}/shims/next-font.ts`;
    aliases["next/font/local"] = `${harness}/shims/next-font.ts`;
    aliases["next/navigation"] = `${harness}/shims/next-navigation.ts`;

    if (profile.globalCssPath) {
        aliases[GLOBAL_CSS_ALIAS] = `${REPO_DIR}/${profile.globalCssPath}`;
    }

    for (const id of capsules.ids) {
        aliases[capsule_alias(id)] = `${capsules_dir(profile)}/${id}/${capsules.revision}.tsx`;
    }

    return aliases;
}

export function render_vite_config(
    profile: AppProfile,
    capsule_ids: string[],
    options: HarnessOptions = DEFAULT_OPTIONS,
    revision: CapsuleRevision = "head",
): string {
    const aliases = resolve_aliases(profile, options, { ids: capsule_ids, revision });
    const harness = harness_dir(profile);
    const inputs = Object.fromEntries(
        capsule_ids.map((id) => [id, `${harness}/pages/${id}/index.html`]),
    );

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

export default defineConfig({
    root: ${JSON.stringify(`${harness}/pages`)},
    base: "./",
    plugins: [react()${tailwind_plugin}],
    resolve: {
        alias: ${JSON.stringify(aliases, null, 8).replace(/\n}/, "\n    }")},
        dedupe: ["react", "react-dom"],
    },
${postcss}    server: {
        fs: { allow: [${JSON.stringify(REPO_DIR)}] },
    },
    build: {
        emptyOutDir: true,
        rollupOptions: {
            input: ${JSON.stringify(inputs, null, 12).replace(/\n}/, "\n        }")},
        },
    },
});
`;
}

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

const controls = Object.fromEntries(new URLSearchParams(window.location.search));
const container = document.getElementById("root");

if (container) createRoot(container).render(<Capsule controls={controls} />);
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

const NEXT_FONT_SHIM = `const face = { className: "", variable: "", style: { fontFamily: "inherit" } };

const load = () => face;

export const Inter = load;
export const Geist = load;
export const Geist_Mono = load;
export const Roboto = load;
export default load;
export { load as localFont };
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

export function harness_files(): Record<string, string> {
    return {
        "network-stub.ts": NETWORK_STUB,
        "shims/next-image.tsx": NEXT_IMAGE_SHIM,
        "shims/next-link.tsx": NEXT_LINK_SHIM,
        "shims/next-font.ts": NEXT_FONT_SHIM,
        "shims/next-navigation.ts": NEXT_NAVIGATION_SHIM,
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
        const options = await this.detect(sandbox, profile);

        const harness = harness_dir(profile);
        await sandbox.commands.run(`rm -rf ${harness}/pages && mkdir -p ${harness}/shims`);

        for (const [name, contents] of Object.entries(harness_files())) {
            await sandbox.files.write(`${harness}/${name}`, contents);
        }

        for (const spec of buildable) {
            const page = `${harness}/pages/${spec.id}`;
            await sandbox.files.write(`${page}/index.html`, render_page_html(spec));
            await sandbox.files.write(`${page}/main.tsx`, render_page_entry(spec, profile));
        }

        const capsule_ids = buildable.map((spec) => spec.id);
        await sandbox.files.write(
            `${harness}/vite.config.ts`,
            render_vite_config(profile, capsule_ids, options, revision),
        );

        return capsule_ids;
    }

    public static async install(sandbox: Sandbox, profile: AppProfile): Promise<void> {
        await sandbox.files.write(
            `${harness_dir(profile)}/package.json`,
            `${JSON.stringify({ name: "matcha-capsule-harness", private: true, type: "module" }, null, 4)}\n`,
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
