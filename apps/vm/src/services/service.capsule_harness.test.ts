import { expect, test } from "bun:test";

import {
    harness_dependencies,
    harness_dir,
    render_vite_config,
    resolve_aliases,
} from "./service.capsule_harness";
import type { AppProfile } from "./service.capsule_workspace";

function profile(overrides: Partial<AppProfile> = {}): AppProfile {
    return {
        appDir: "apps/web",
        packageManager: "bun",
        tailwindMajor: 4,
        globalCssPath: "apps/web/app/globals.css",
        tsconfigPaths: { "@/*": ["./*"] },
        ...overrides,
    };
}

test("a tsconfig path becomes a vite alias rooted at the app", () => {
    const aliases = resolve_aliases(profile());
    expect(aliases["@"]).toBe("/home/user/repo/apps/web");
});

test("a path mapping without a wildcard still resolves", () => {
    const aliases = resolve_aliases(
        profile({ tsconfigPaths: { "~config": ["./config/index.ts"] } }),
    );
    expect(aliases["~config"]).toBe("/home/user/repo/apps/web/config/index.ts");
});

test("aliases are rooted at the repo when the app is the repo", () => {
    const aliases = resolve_aliases(profile({ appDir: ".", tsconfigPaths: { "@/*": ["./src/*"] } }));
    expect(aliases["@"]).toBe("/home/user/repo/src");
});

test("every framework only module is shimmed, since plain vite cannot resolve them", () => {
    const aliases = resolve_aliases(profile());
    expect(aliases["next/image"]).toContain("shims/next-image");
    expect(aliases["next/link"]).toContain("shims/next-link");
    expect(aliases["next/font/google"]).toContain("shims/next-font");
    expect(aliases["next/font/local"]).toContain("shims/next-font");
    expect(aliases["next/navigation"]).toContain("shims/next-navigation");
});

test("tailwind v4 builds through its vite plugin", () => {
    const config = render_vite_config(profile({ tailwindMajor: 4 }), ["faq-item"]);
    expect(config).toContain("@tailwindcss/vite");
    expect(harness_dependencies(profile({ tailwindMajor: 4 })).join(" ")).toContain(
        "@tailwindcss/vite@",
    );
});

test("tailwind v3 builds through postcss instead", () => {
    const config = render_vite_config(profile({ tailwindMajor: 3 }), ["faq-item"]);
    expect(config).not.toContain("@tailwindcss/vite");
    expect(config).toContain("postcss");
    expect(harness_dependencies(profile({ tailwindMajor: 3 })).join(" ")).toContain(
        "tailwindcss@",
    );
});

test("a project without tailwind pulls in no tailwind packages", () => {
    const dependencies = harness_dependencies(profile({ tailwindMajor: null }));
    expect(dependencies.some((name) => name.includes("tailwind"))).toBe(false);
});

test("the build emits one page per capsule", () => {
    const config = render_vite_config(profile(), ["faq-item", "badge"]);
    expect(config).toContain(`${harness_dir(profile())}/pages/faq-item/index.html`);
    expect(config).toContain(`${harness_dir(profile())}/pages/badge/index.html`);
});

test("assets are addressed relatively so the bundle works from any storage prefix", () => {
    expect(render_vite_config(profile(), ["faq-item"])).toContain('base: "./"');
});

test("each page is self contained, because only the page itself gets a signed link", () => {
    const config = render_vite_config(profile(), ["faq-item"]);
    expect(config).toContain("viteSingleFile()");
    expect(config).toContain("assetsInlineLimit");
    expect(harness_dependencies(profile()).join(" ")).toContain("vite-plugin-singlefile@");
});

test("the repo is allowed as a filesystem root, since the entries import out of the harness", () => {
    expect(render_vite_config(profile(), ["faq-item"])).toContain("/home/user/repo");
});

test("the harness lives inside the app, where its react actually is", () => {
    expect(harness_dir(profile())).toBe("/home/user/repo/apps/web/.matcha/harness");
    expect(harness_dir(profile({ appDir: "." }))).toBe("/home/user/repo/.matcha/harness");
});

test("react is never aliased, because a string alias breaks react/jsx-runtime", () => {
    const aliases = resolve_aliases(profile());
    expect(aliases["react"]).toBeUndefined();
    expect(aliases["react-dom"]).toBeUndefined();
    expect(render_vite_config(profile(), ["faq-item"])).toContain('dedupe: ["react", "react-dom"]');
});
