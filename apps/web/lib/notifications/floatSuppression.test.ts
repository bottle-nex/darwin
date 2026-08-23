import { describe, expect, test } from "bun:test";
import { NotificationType, type Notification } from "@trymatcha/types";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { should_float_notification } from "./floatSuppression";

function notification(type: NotificationType, projectId: string | null): Notification {
    return {
        id: "n1",
        userId: "viewer-1",
        projectId,
        type,
        payload: {},
        readAt: null,
        createdAt: new Date("2026-08-23T10:00:00.000Z"),
    } as Notification;
}

const member = notification(NotificationType.RemovedFromTeam, null);
const board = notification(NotificationType.IssueAssigned, "project-a");

describe("member events follow the bell panel only", () => {
    test("float while the panel is closed", () => {
        expect(should_float_notification(member, false, PlaygroundTab.Kanban, "project-a")).toBe(
            true,
        );
    });

    test("suppressed while the panel is open", () => {
        expect(should_float_notification(member, true, PlaygroundTab.Kanban, "project-a")).toBe(
            false,
        );
    });

    test("the active tab and project are irrelevant to member events", () => {
        expect(should_float_notification(member, false, PlaygroundTab.Inbox, "project-a")).toBe(
            true,
        );
        expect(should_float_notification(member, true, PlaygroundTab.Inbox, null)).toBe(false);
    });
});

describe("board events follow the inbox pane only", () => {
    test("suppressed only when its own project's inbox is visible", () => {
        expect(should_float_notification(board, false, PlaygroundTab.Inbox, "project-a")).toBe(
            false,
        );
    });

    test("floats on any other tab", () => {
        for (const tab of [PlaygroundTab.Kanban, PlaygroundTab.Chats, PlaygroundTab.AssignedToMe]) {
            expect(should_float_notification(board, false, tab, "project-a")).toBe(true);
        }
    });

    test("floats while settings is visible even though the inbox stays mounted behind it", () => {
        expect(
            should_float_notification(board, false, PlaygroundTab.SettingsAppearance, "project-a"),
        ).toBe(true);
    });

    test("floats for another project while viewing this project's inbox", () => {
        expect(should_float_notification(board, false, PlaygroundTab.Inbox, "project-b")).toBe(
            true,
        );
    });

    test("floats when there is no active project", () => {
        expect(should_float_notification(board, false, PlaygroundTab.Inbox, null)).toBe(true);
    });

    test("the bell panel does not suppress board events", () => {
        expect(should_float_notification(board, true, PlaygroundTab.Kanban, "project-a")).toBe(
            true,
        );
    });
});
