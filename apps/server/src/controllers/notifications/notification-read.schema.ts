import z from "zod";

const ids_schema = z.array(z.string().min(1).max(191)).min(1).max(100).optional();

export const notification_read_body_schema = z.discriminatedUnion("scope", [
    z
        .object({
            scope: z.literal("project"),
            projectId: z.string().min(1).max(191),
            ids: ids_schema,
        })
        .strict(),
    z
        .object({
            scope: z.literal("member"),
            ids: ids_schema,
        })
        .strict(),
]);

export type NotificationReadBody = z.infer<typeof notification_read_body_schema>;
