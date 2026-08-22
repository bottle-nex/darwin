import { describe, expect, test } from "bun:test";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import {
    breadcrumbTargetForBoard,
    PROJECT_BREADCRUMB_TARGET,
    SETTINGS_BREADCRUMB_TARGET,
} from "./PlaygroundBreadcrumb";

describe("playground breadcrumb navigation", () => {
    test("the project crumb returns to the Kanban home", () => {
        expect(PROJECT_BREADCRUMB_TARGET).toEqual({
            tab: PlaygroundTab.Kanban,
            boardView: "default",
        });
    });

    test("issue board crumbs return to the board that owns the issue", () => {
        expect(breadcrumbTargetForBoard(false)).toEqual({
            tab: PlaygroundTab.Kanban,
            boardView: "llm",
        });
        expect(breadcrumbTargetForBoard(true)).toEqual({
            tab: PlaygroundTab.Kanban,
            boardView: "custom",
        });
    });

    test("the Settings parent crumb opens the Settings landing section", () => {
        expect(SETTINGS_BREADCRUMB_TARGET).toEqual({
            tab: PlaygroundTab.SettingsAppearance,
        });
    });
});
