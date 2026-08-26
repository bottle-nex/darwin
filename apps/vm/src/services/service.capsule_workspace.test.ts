import { expect, test } from "bun:test";

import {
    install_command,
    type PackageCandidate,
    pick_app_dir,
    pick_package_manager,
    read_tailwind_major,
} from "./service.capsule_workspace";

test("the lockfile decides the package manager", () => {
    expect(pick_package_manager(["package.json", "bun.lock"])).toBe("bun");
    expect(pick_package_manager(["package.json", "bun.lockb"])).toBe("bun");
    expect(pick_package_manager(["package.json", "pnpm-lock.yaml"])).toBe("pnpm");
    expect(pick_package_manager(["package.json", "yarn.lock"])).toBe("yarn");
    expect(pick_package_manager(["package.json", "package-lock.json"])).toBe("npm");
});

test("a repo with no lockfile falls back to npm", () => {
    expect(pick_package_manager(["package.json", "README.md"])).toBe("npm");
});

test("bun wins when several lockfiles are committed", () => {
    expect(pick_package_manager(["yarn.lock", "package-lock.json", "bun.lock"])).toBe("bun");
});

test("install commands are frozen so a run never rewrites the lockfile", () => {
    expect(install_command("bun")).toBe("bun install --frozen-lockfile");
    expect(install_command("pnpm")).toBe("pnpm install --frozen-lockfile");
    expect(install_command("yarn")).toBe("yarn install --immutable");
    expect(install_command("npm")).toBe("npm ci");
});

test("the tailwind major comes from its declared range", () => {
    expect(read_tailwind_major({ tailwindcss: "^4.1.3" })).toBe(4);
    expect(read_tailwind_major({ tailwindcss: "~3.4.1" })).toBe(3);
    expect(read_tailwind_major({ tailwindcss: "3" })).toBe(3);
    expect(read_tailwind_major({ tailwindcss: ">=4.0.0 <5" })).toBe(4);
});

test("a repo without tailwind reports no major", () => {
    expect(read_tailwind_major({ react: "19.0.0" })).toBe(null);
    expect(read_tailwind_major({ tailwindcss: "workspace:*" })).toBe(null);
});

test("the only react package wins regardless of the changed files", () => {
    const candidates: PackageCandidate[] = [{ dir: "apps/web", dependencies: { react: "19.0.0" } }];
    expect(pick_app_dir(candidates, ["apps/web/components/Card.tsx"])).toBe("apps/web");
});

test("a package without react is never chosen", () => {
    const candidates: PackageCandidate[] = [
        { dir: ".", dependencies: { turbo: "2.0.0" } },
        { dir: "packages/api", dependencies: { express: "5.0.0" } },
    ];
    expect(pick_app_dir(candidates, ["packages/api/src/index.ts"])).toBe(null);
});

test("the react package holding the most changed files wins in a monorepo", () => {
    const candidates: PackageCandidate[] = [
        { dir: "apps/web", dependencies: { react: "19.0.0" } },
        { dir: "apps/admin", dependencies: { react: "19.0.0" } },
    ];
    const changed = [
        "apps/admin/src/Panel.tsx",
        "apps/web/components/Card.tsx",
        "apps/web/components/Badge.tsx",
    ];
    expect(pick_app_dir(candidates, changed)).toBe("apps/web");
});

test("the deepest matching package wins over an ancestor that also has react", () => {
    const candidates: PackageCandidate[] = [
        { dir: ".", dependencies: { react: "19.0.0" } },
        { dir: "apps/web", dependencies: { react: "19.0.0" } },
    ];
    expect(pick_app_dir(candidates, ["apps/web/components/Card.tsx"])).toBe("apps/web");
});

test("a react package that holds no changed file still wins over nothing", () => {
    const candidates: PackageCandidate[] = [{ dir: "apps/web", dependencies: { react: "19.0.0" } }];
    expect(pick_app_dir(candidates, ["docs/readme.md"])).toBe("apps/web");
});
