import z from "zod";

export const icon_schema = z.discriminatedUnion("kind", [
    z.object({
        kind: z.literal("icon"),
        name: z.string().min(1).max(64),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }),
    z.object({ kind: z.literal("emoji"), char: z.string().min(1).max(8) }),
]);
