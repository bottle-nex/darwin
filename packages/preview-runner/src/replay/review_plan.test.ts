import { expect, test } from "bun:test";

import { read_replay_review_plan } from "./review_plan";

const validPlan = {
    applications: [{ id: "marketing", applicationPath: "apps/marketing", adapterId: "next" }],
    surfaces: [
        {
            id: "pricing",
            applicationId: "marketing",
            label: "Pricing",
            sourcePaths: ["app/pricing/page.tsx"],
            entry: { kind: "route", path: "/pricing" },
            rootLayoutMode: "inherit",
            states: [
                {
                    id: "default",
                    label: "Default",
                    scenarios: [
                        {
                            id: "show-annual",
                            label: "Show annual billing",
                            actions: [
                                {
                                    kind: "click",
                                    selector: { role: "button", name: "Annual" },
                                },
                            ],
                        },
                    ],
                },
            ],
            viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
        },
    ],
};

test("reads a valid declarative replay review plan", () => {
    expect(read_replay_review_plan(validPlan)).toEqual(
        expect.objectContaining({ surfaces: expect.any(Array) }),
    );
});

test("rejects arbitrary script actions", () => {
    expect(() =>
        read_replay_review_plan({
            ...validPlan,
            surfaces: [
                {
                    ...validPlan.surfaces[0],
                    states: [
                        {
                            ...validPlan.surfaces[0].states[0],
                            scenarios: [
                                { id: "script", label: "Script", actions: [{ kind: "evaluate" }] },
                            ],
                        },
                    ],
                },
            ],
        }),
    ).toThrow();
});

test("rejects paths that escape the application directory", () => {
    expect(() =>
        read_replay_review_plan({
            ...validPlan,
            surfaces: [{ ...validPlan.surfaces[0], sourcePaths: ["../secrets.ts"] }],
        }),
    ).toThrow();
});

test("rejects surfaces with an unknown application", () => {
    expect(() =>
        read_replay_review_plan({
            ...validPlan,
            surfaces: [{ ...validPlan.surfaces[0], applicationId: "unknown" }],
        }),
    ).toThrow();
});

test("rejects scenarios with more than twelve actions", () => {
    expect(() =>
        read_replay_review_plan({
            ...validPlan,
            surfaces: [
                {
                    ...validPlan.surfaces[0],
                    states: [
                        {
                            ...validPlan.surfaces[0].states[0],
                            scenarios: [
                                {
                                    id: "too-many-actions",
                                    label: "Too many actions",
                                    actions: Array.from({ length: 13 }, () => ({
                                        kind: "waitFor",
                                        selector: { testId: "pricing-table" },
                                    })),
                                },
                            ],
                        },
                    ],
                },
            ],
        }),
    ).toThrow();
});

test("rejects unknown action fields", () => {
    expect(() =>
        read_replay_review_plan({
            ...validPlan,
            surfaces: [
                {
                    ...validPlan.surfaces[0],
                    states: [
                        {
                            ...validPlan.surfaces[0].states[0],
                            scenarios: [
                                {
                                    id: "unknown-field",
                                    label: "Unknown field",
                                    actions: [
                                        {
                                            kind: "click",
                                            selector: { role: "button", name: "Annual" },
                                            script: "alert('not allowed')",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        }),
    ).toThrow();
});

test("rejects unknown viewport fields", () => {
    expect(() =>
        read_replay_review_plan({
            ...validPlan,
            surfaces: [
                {
                    ...validPlan.surfaces[0],
                    viewports: [
                        {
                            ...validPlan.surfaces[0].viewports[0],
                            script: "alert('not allowed')",
                        },
                    ],
                },
            ],
        }),
    ).toThrow();
});

test("rejects plans with more than twelve surfaces", () => {
    expect(() =>
        read_replay_review_plan({
            ...validPlan,
            surfaces: Array.from({ length: 13 }, (_, index) => ({
                ...validPlan.surfaces[0],
                id: `pricing-${index}`,
            })),
        }),
    ).toThrow();
});

test("rejects surfaces with more than six states", () => {
    expect(() =>
        read_replay_review_plan({
            ...validPlan,
            surfaces: [
                {
                    ...validPlan.surfaces[0],
                    states: Array.from({ length: 7 }, (_, index) => ({
                        id: `state-${index}`,
                        label: `State ${index}`,
                        scenarios: [],
                    })),
                },
            ],
        }),
    ).toThrow();
});
