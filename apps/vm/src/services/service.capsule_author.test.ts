import { expect, test } from "bun:test";

import {
    build_author_prompt,
    build_repair_prompt,
    capsule_dir,
    capsule_spec_schema,
    reject_split_fixture,
} from "./service.capsule_author";
import type { CapsuleTarget } from "./service.capsule_targets";
import type { AppProfile } from "./service.capsule_workspace";

const profile: AppProfile = {
    appDir: "apps/web",
    packageManager: "bun",
    tailwindMajor: 4,
    globalCssPath: "apps/web/app/globals.css",
};

const targets: CapsuleTarget[] = [
    {
        id: "apps-web-components-faq-item",
        componentPath: "apps/web/components/marketing/FaqItem.tsx",
        basePath: "apps/web/components/marketing/FaqItem.tsx",
        change: "Modified",
    },
    {
        id: "apps-web-components-badge",
        componentPath: "apps/web/components/ui/Badge.tsx",
        basePath: null,
        change: "Added",
    },
];

test("every capsule lives under its own id", () => {
    expect(capsule_dir(profile, "apps-web-components-faq-item")).toBe(
        "/home/user/repo/apps/web/.matcha/capsules/apps-web-components-faq-item",
    );
});

test("one prompt carries every target, so six components cost one run", () => {
    const prompt = build_author_prompt(targets, profile);
    expect(prompt).toContain("apps/web/components/marketing/FaqItem.tsx");
    expect(prompt).toContain("apps/web/components/ui/Badge.tsx");
    expect(prompt).toContain("apps-web-components-faq-item");
});

test("the prompt states the shared fixture rule, which the whole design rests on", () => {
    const prompt = build_author_prompt(targets, profile);
    expect(prompt).toContain("fixture.json");
    expect(prompt.toLowerCase()).toContain("identical");
});

test("a capsule added in this pull request is not asked for a base entry", () => {
    const prompt = build_author_prompt(targets, profile);
    expect(prompt).toContain("Badge.tsx does not exist at the base revision");
});

test("a repair prompt names only the capsules that failed, with their errors", () => {
    const prompt = build_repair_prompt(
        [
            {
                capsuleId: "apps-web-components-faq-item",
                revision: "head",
                diagnostics: ["TypeError: issues.map is not a function"],
            },
        ],
        "/home/user/repo/apps/web/.matcha/capsules",
        "/home/user/repo/apps/web/.matcha/harness/matcha.overrides.ts",
    );
    expect(prompt).toContain("apps-web-components-faq-item");
    expect(prompt).toContain("head");
    expect(prompt).toContain("issues.map is not a function");
    expect(prompt).not.toContain("apps-web-components-badge");
});

test("a capsule.json without controls is rejected", () => {
    const parsed = capsule_spec_schema.safeParse({
        title: "FaqItem",
        viewport: { width: 720, height: 240 },
    });
    expect(parsed.success).toBe(false);
});

test("a well formed capsule.json is accepted", () => {
    const parsed = capsule_spec_schema.safeParse({
        title: "FaqItem",
        viewport: { width: 720, height: 240 },
        controls: [
            { name: "variant", kind: "enum", options: ["default", "compact"], default: "default" },
            { name: "defaultOpen", kind: "boolean", default: false },
        ],
    });
    expect(parsed.success).toBe(true);
});

test("an enum control without options is rejected, because it would render an empty dropdown", () => {
    const parsed = capsule_spec_schema.safeParse({
        title: "FaqItem",
        viewport: { width: 720, height: 240 },
        controls: [{ name: "variant", kind: "enum", default: "default" }],
    });
    expect(parsed.success).toBe(false);
});

test("a viewport with no size is rejected", () => {
    const parsed = capsule_spec_schema.safeParse({
        title: "FaqItem",
        viewport: { width: 0, height: 240 },
        controls: [],
    });
    expect(parsed.success).toBe(false);
});

test("entries importing the same fixture are accepted", () => {
    const problem = reject_split_fixture({
        base: 'import fixture from "./fixture.json";\nexport default fixture;',
        head: 'import fixture from "./fixture.json";\nexport default fixture;',
    });
    expect(problem).toBe(null);
});

test("entries importing different fixtures are rejected, because a split lie invents diffs", () => {
    const problem = reject_split_fixture({
        base: 'import fixture from "./fixture.base.json";',
        head: 'import fixture from "./fixture.json";',
    });
    expect(problem).toContain("fixture");
});

test("a head-only capsule cannot split its fixture", () => {
    expect(reject_split_fixture({ base: null, head: 'import f from "./fixture.json";' })).toBe(
        null,
    );
});

test("a component that hardcodes its own content needs no fixture", () => {
    const parameterless = "export default function Capsule() { return <LandingFooter />; }";
    expect(reject_split_fixture({ base: parameterless, head: parameterless })).toBe(null);
});

test("a fixture read by only one side is rejected, since the sides would then differ", () => {
    const problem = reject_split_fixture({
        base: "export default () => <Thing />;",
        head: 'import fixture from "./fixture.json";\nexport default () => <Thing {...fixture} />;',
    });
    expect(problem).toContain("identical");
});

test("a capsule with no entry at all is still rejected", () => {
    expect(reject_split_fixture({ base: null, head: null })).toContain("no capsule entry");
});

test("a repair agent is told where a resolution fix can survive", () => {
    const prompt = build_repair_prompt(
        [{ capsuleId: "hero", revision: "base", diagnostics: ["Rollup failed to resolve import"] }],
        "/home/user/repo/apps/web/.matcha/capsules",
        "/home/user/repo/apps/web/.matcha/harness/matcha.overrides.ts",
    );

    expect(prompt).toContain("matcha.overrides.ts");
    expect(prompt).toContain("never regenerated");
    expect(prompt).toContain("aliases");
});
