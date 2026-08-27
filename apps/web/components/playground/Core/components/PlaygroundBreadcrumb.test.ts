import { describe, expect, test } from "bun:test";

import { PlaygroundTab } from "@/components/playground/playgroundTabs";

import {
    breadcrumbTargetForIssue,
    PROJECT_BREADCRUMB_TARGET,
    SETTINGS_BREADCRUMB_TARGET,
} from "./PlaygroundBreadcrumb";

const CHAPTER = { id: "chapter-1", name: "Backlog", slug: "backlog", order: 1 };

describe("playground breadcrumb navigation", () => {
    test("the project crumb returns to the agent board", () => {
        expect(PROJECT_BREADCRUMB_TARGET).toEqual({ tab: PlaygroundTab.Agent });
    });

    test("issue board crumbs return to the board that owns the issue", () => {
        expect(breadcrumbTargetForIssue(undefined)).toEqual({ tab: PlaygroundTab.Agent });
        expect(breadcrumbTargetForIssue(CHAPTER)).toEqual({
            tab: PlaygroundTab.Chapter,
            chapter: CHAPTER,
        });
    });

    test("the Settings parent crumb opens the Settings landing section", () => {
        expect(SETTINGS_BREADCRUMB_TARGET).toEqual({
            tab: PlaygroundTab.SettingsAppearance,
        });
    });
});
