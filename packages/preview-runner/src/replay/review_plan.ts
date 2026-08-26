import { replayReviewPlanSchema, type ReplayReviewPlan } from "../contract";

export function read_replay_review_plan(input: unknown): ReplayReviewPlan {
    return replayReviewPlanSchema.parse(input);
}
