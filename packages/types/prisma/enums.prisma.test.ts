import { describe, expect, test } from "bun:test";
import { NotificationType } from "./enums.prisma";
import { NOTIFICATION_SCOPE } from "../notifications/notification-scope";

const SCHEMA_PATH = new URL("../../database/prisma/schema/notification.prisma", import.meta.url)
    .pathname;

async function schema_enum_values(name: string): Promise<string[]> {
    const source = await Bun.file(SCHEMA_PATH).text();
    const body = new RegExp(`enum ${name} \\{([^}]*)\\}`).exec(source)?.[1];
    if (body === undefined) throw new Error(`enum ${name} not found in ${SCHEMA_PATH}`);
    return body
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("//"));
}

describe("NotificationType mirror", () => {
    test("matches the prisma enum exactly", async () => {
        const from_schema = await schema_enum_values("NotificationType");

        expect(new Set(from_schema)).toEqual(new Set(Object.keys(NotificationType)));
        expect(from_schema).toHaveLength(Object.keys(NotificationType).length);
    });

    test("every prisma enum value has a scope", async () => {
        const from_schema = await schema_enum_values("NotificationType");
        const scoped = new Set(Object.keys(NOTIFICATION_SCOPE));

        expect(from_schema.filter((value) => !scoped.has(value))).toEqual([]);
    });
});
