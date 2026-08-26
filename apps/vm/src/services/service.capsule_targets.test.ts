import { expect, test } from "bun:test";

import {
    capsule_id,
    classify_diff_line,
    is_previewable_source,
    MAX_CAPSULES,
    select_targets,
} from "./service.capsule_targets";

test("an added file has no base path", () => {
    expect(classify_diff_line("A\tapps/web/components/Card.tsx")).toEqual({
        change: "Added",
        componentPath: "apps/web/components/Card.tsx",
        basePath: null,
    });
});

test("a deleted file keeps its base path and loses its head path", () => {
    expect(classify_diff_line("D\tapps/web/components/Card.tsx")).toEqual({
        change: "Removed",
        componentPath: "apps/web/components/Card.tsx",
        basePath: "apps/web/components/Card.tsx",
    });
});

test("a rename is a modification whose base lives at the old path", () => {
    expect(classify_diff_line("R096\tapps/web/Old.tsx\tapps/web/New.tsx")).toEqual({
        change: "Modified",
        componentPath: "apps/web/New.tsx",
        basePath: "apps/web/Old.tsx",
    });
});

test("a modified file shares one path across both revisions", () => {
    expect(classify_diff_line("M\tapps/web/components/Card.tsx")).toEqual({
        change: "Modified",
        componentPath: "apps/web/components/Card.tsx",
        basePath: "apps/web/components/Card.tsx",
    });
});

test("an unreadable diff line is skipped rather than guessed at", () => {
    expect(classify_diff_line("")).toBe(null);
    expect(classify_diff_line("M")).toBe(null);
});

test("only component files inside the app are previewable", () => {
    expect(is_previewable_source("apps/web/components/Card.tsx", "apps/web")).toBe(true);
    expect(is_previewable_source("apps/web/components/Card.jsx", "apps/web")).toBe(true);
    expect(is_previewable_source("apps/web/lib/utils.ts", "apps/web")).toBe(false);
    expect(is_previewable_source("apps/admin/components/Card.tsx", "apps/web")).toBe(false);
    expect(is_previewable_source("apps/web/globals.css", "apps/web")).toBe(false);
});

test("tests, stories and api routes are never previewed", () => {
    expect(is_previewable_source("apps/web/components/Card.test.tsx", "apps/web")).toBe(false);
    expect(is_previewable_source("apps/web/components/Card.spec.tsx", "apps/web")).toBe(false);
    expect(is_previewable_source("apps/web/components/Card.stories.tsx", "apps/web")).toBe(false);
    expect(is_previewable_source("apps/web/app/api/issues/route.tsx", "apps/web")).toBe(false);
});

test("the id is the whole path, so two Card.tsx never collide", () => {
    expect(capsule_id("apps/web/components/board/Card.tsx")).toBe("apps-web-components-board-card");
    expect(capsule_id("apps/web/components/board/Card.tsx")).not.toBe(
        capsule_id("apps/web/components/marketing/Card.tsx"),
    );
});

test("a server component is skipped with a reason the reviewer can read", () => {
    const { targets, warnings } = select_targets(
        [
            {
                change: "Modified",
                componentPath: "apps/web/app/Page.tsx",
                basePath: "apps/web/app/Page.tsx",
            },
        ],
        {
            "apps/web/app/Page.tsx":
                'import { db } from "@/db";\n\nexport default async function Page() {}',
        },
    );
    expect(targets).toHaveLength(0);
    expect(warnings[0]).toContain("apps/web/app/Page.tsx");
    expect(warnings[0]).toContain("server");
});

test("a file marked use server is skipped", () => {
    const { targets } = select_targets(
        [
            {
                change: "Modified",
                componentPath: "apps/web/actions/Save.tsx",
                basePath: "apps/web/actions/Save.tsx",
            },
        ],
        { "apps/web/actions/Save.tsx": '"use server";\n\nexport function Save() {}' },
    );
    expect(targets).toHaveLength(0);
});

test("a client component survives selection", () => {
    const { targets, warnings } = select_targets(
        [
            {
                change: "Modified",
                componentPath: "apps/web/components/Card.tsx",
                basePath: "apps/web/components/Card.tsx",
            },
        ],
        {
            "apps/web/components/Card.tsx":
                '"use client";\n\nexport function Card() { return <div />; }',
        },
    );
    expect(warnings).toHaveLength(0);
    expect(targets).toEqual([
        {
            id: "apps-web-components-card",
            componentPath: "apps/web/components/Card.tsx",
            basePath: "apps/web/components/Card.tsx",
            change: "Modified",
        },
    ]);
});

test("selection stops at the cap and names every file it dropped", () => {
    const candidates = Array.from({ length: MAX_CAPSULES + 3 }, (_, index) => ({
        change: "Modified" as const,
        componentPath: `apps/web/components/Card${index}.tsx`,
        basePath: `apps/web/components/Card${index}.tsx`,
    }));
    const sources = Object.fromEntries(
        candidates.map((candidate) => [candidate.componentPath, "export function C() {}"]),
    );

    const { targets, warnings } = select_targets(candidates, sources);
    expect(targets).toHaveLength(MAX_CAPSULES);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(`Card${MAX_CAPSULES}.tsx`);
    expect(warnings[0]).toContain(`Card${MAX_CAPSULES + 2}.tsx`);
});
