import { is_reaction_emoji } from "@trymatcha/types";
import z from "zod";

export const reaction_payload_schema = z.object({
    chatId: z.string().min(1),
    emoji: z.string().refine(is_reaction_emoji),
    operationId: z.string().min(1),
});

const operation_id_schema = z.object({ operationId: z.string().min(1) });

export function pending_operation_id(raw_payload: unknown) {
    const parsed = operation_id_schema.safeParse(raw_payload);
    return parsed.success ? parsed.data.operationId : undefined;
}
