import { expect, test } from "bun:test";

import { build_command, checkout_steps, dist_dir, trim_build_error } from "./service.capsule_build";
import type { AppProfile } from "./service.capsule_workspace";

const profile: AppProfile = {
    appDir: "apps/web",
    packageManager: "bun",
    tailwindMajor: 4,
    globalCssPath: "apps/web/app/globals.css",
};

test("each revision builds into its own output directory", () => {
    expect(dist_dir("base")).toBe("/home/user/dist/base");
    expect(dist_dir("head")).toBe("/home/user/dist/head");
});

test("the build runs vite from the harness into that revision's directory", () => {
    const command = build_command("head");
    expect(command).toContain("vite build");
    expect(command).toContain("/home/user/dist/head");
});

test("the output directory is never emptied per capsule, or each build would erase the last", () => {
    expect(build_command("head")).not.toContain("--emptyOutDir");
});

test("the capsules are stashed before checkout and restored after", () => {
    const steps = checkout_steps(profile, "abc123");
    const joined = steps.join(" | ");

    expect(joined).toContain("abc123");
    expect(steps.findIndex((step) => step.includes("git checkout"))).toBeGreaterThan(
        steps.findIndex((step) => step.includes("mv")),
    );
});

test("checkout is forced, because the previous revision left files behind", () => {
    expect(checkout_steps(profile, "abc123").join(" ")).toContain("--force");
});

test("the capsules survive the checkout by living outside the working tree", () => {
    const steps = checkout_steps(profile, "abc123");
    expect(steps.some((step) => step.includes("/home/user/matcha-carry"))).toBe(true);
});

test("a build failure keeps the tail of the error, where the cause actually is", () => {
    const noise = `${"context line\n".repeat(500)}error TS2322: Type 'string' is not assignable`;
    const trimmed = trim_build_error(noise);

    expect(trimmed.length).toBeLessThanOrEqual(2000);
    expect(trimmed).toContain("error TS2322");
});

test("a short build failure is kept whole", () => {
    expect(trim_build_error("Rollup failed to resolve import")).toBe(
        "Rollup failed to resolve import",
    );
});
