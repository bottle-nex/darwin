import { beforeEach, describe, expect, test } from "bun:test";
import { NotificationScope, NotificationType, type Notification } from "@trymatcha/types";
import { useFloatNotificationsStore } from "./useFloatNotificationsStore";

function notification(id: string, type: NotificationType, projectId: string | null): Notification {
    return {
        id,
        userId: "viewer-1",
        projectId,
        type,
        payload: {},
        readAt: null,
        createdAt: new Date("2026-08-23T10:00:00.000Z"),
    } as Notification;
}

const board_a = notification("a", NotificationType.IssueAssigned, "project-a");
const board_b = notification("b", NotificationType.IssueAssigned, "project-b");
const member = notification("m", NotificationType.RemovedFromTeam, null);

const ids = () => useFloatNotificationsStore.getState().items.map((item) => item.id);

describe("useFloatNotificationsStore.clearScope", () => {
    beforeEach(() => {
        useFloatNotificationsStore.setState({ items: [] });
        for (const item of [board_a, board_b, member]) {
            useFloatNotificationsStore.getState().push(item);
        }
    });

    test("clearing one project's board floats leaves the other project's alone", () => {
        useFloatNotificationsStore.getState().clearScope(NotificationScope.Project, "project-a");

        expect(ids().sort()).toEqual(["b", "m"]);
    });

    test("clearing member floats leaves every board float alone", () => {
        useFloatNotificationsStore.getState().clearScope(NotificationScope.Member);

        expect(ids().sort()).toEqual(["a", "b"]);
    });

    test("omitting the project clears every float in that scope", () => {
        useFloatNotificationsStore.getState().clearScope(NotificationScope.Project);

        expect(ids()).toEqual(["m"]);
    });

    test("caps the queue and dedupes by id", () => {
        useFloatNotificationsStore.setState({ items: [] });
        for (const id of ["1", "2", "3", "4", "1"]) {
            useFloatNotificationsStore
                .getState()
                .push(notification(id, NotificationType.IssueAssigned, "project-a"));
        }

        expect(ids()).toHaveLength(3);
    });
});
