import Logger from "@trymatcha/logger";
import {
    Effort,
    Harness,
    IssueStatus,
    prisma,
    WorkerStatus,
    type Issue,
    type Worker,
} from "@trymatcha/database";
import type QueueService from "../services/services.queue";
import { ChatAnthropic } from "@langchain/anthropic";
import { ENV } from "../config/config.env";
import z from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { routerPrompt } from "../prompts/prompt.router";
import { Registry } from "@trymatcha/harness";

const log = Logger.scope("route");

interface Assignment {
    issueId: string;
    workerId: string;
    specialization: string;
    model?: string;
    effort?: Effort;
}

interface ResolvedConfig {
    harness: Harness;
    model: string;
    effort: Effort | null;
}

const ai_value = z.object({
    assignments: z.array(
        z.object({
            issueId: z.string().nonempty(),
            workerId: z.string().nonempty(),
            specialization: z.string().nonempty().describe("describe the issue is specialized for"),
            model: z
                .string()
                .optional()
                .describe(
                    "Only set for issue ids listed as needing a model pick. Must be one of the provided available models.",
                ),
            effort: z
                .enum(Effort)
                .optional()
                .describe("Only set when effort selection is offered for this project's harness."),
        }),
    ),
});

export default class RouterProcessor {
    static async process_route_job(projectId: string, queue: QueueService) {
        const claimed_at = new Date();
        const claim = await prisma.project.updateMany({
            where: { id: projectId, routingClaimedAt: null },
            data: { routingClaimedAt: claimed_at },
        });

        if (claim.count === 0) {
            log.info("already being routed elsewhere — skipping", { project: projectId });
            return;
        }

        try {
            await this.route_project(projectId, queue);
        } finally {
            await this.release_claim(projectId, claimed_at);
        }
    }

    static async release_claim(projectId: string, claimed_at: Date) {
        try {
            await prisma.project.updateMany({
                where: { id: projectId, routingClaimedAt: claimed_at },
                data: { routingClaimedAt: null },
            });
        } catch (err) {
            log.error("failed to release routing claim", err, { project: projectId });
        }
    }

    static async route_project(projectId: string, queue: QueueService) {
        log.step("fetching active workers and new issues", { project: projectId });
        const [active_workers, todos] = await Promise.all([
            prisma.worker.findMany({
                where: {
                    projectId,
                    status: {
                        not: WorkerStatus.Dead,
                    },
                },
            }),
            prisma.issue.findMany({
                where: {
                    projectId,
                    status: IssueStatus.Todo,
                },
                orderBy: {
                    createdAt: "asc",
                },
                include: {
                    issueConfig: { select: { harness: true } },
                },
            }),
        ]);

        if (todos.length === 0) {
            log.info("no Todo issues to route", { workers: active_workers.length });
            return;
        }

        log.info("fetched", { workers: active_workers.length, issues: todos.length });

        log.step("loading worker history and project brief");
        const [history, project] = await Promise.all([
            prisma.$transaction(async (tx) => {
                const history = new Map<string, Issue[]>();
                for (const worker of active_workers) {
                    const issues = await tx.issue.findMany({
                        where: {
                            projectId,
                            assignerWorkerId: worker.id,
                        },
                        orderBy: {
                            updatedAt: "desc",
                        },
                        take: 5,
                    });
                    history.set(worker.id, issues);
                }
                return history;
            }),
            prisma.project.findUnique({
                where: { id: projectId },
                select: {
                    planMd: true,
                    maxWorkers: true,
                    projectConfig: {
                        select: { harness: true, defaultModel: true, defaultEffort: true },
                    },
                },
            }),
        ]);

        let plan_md =
            project?.planMd ||
            "no need to see the plan, just map this single issue with the worker";

        if (!project) return;

        log.info("loaded context", { history: history.size, brief: project.planMd ? "yes" : "no" });

        const new_workers = await this.spin_up_workers(
            projectId,
            active_workers.length,
            todos.length,
            project.maxWorkers,
        );

        // The whole pass is scoped to one project, so there is exactly one Harness in play —
        // resolved once here, not per issue.
        const effective_harness = project.projectConfig?.harness ?? Harness.Claude;
        const default_model = project.projectConfig?.defaultModel ?? null;
        const default_effort = project.projectConfig?.defaultEffort ?? null;

        // Issues that already carry an explicit IssueConfig are never re-resolved here —
        // materialization only ever happens once, the first time an issue is actually routed.
        const unconfigured = todos.filter((issue) => !issue.issueConfig);
        const needs_pick_ids = default_model ? [] : unconfigured.map((issue) => issue.id);

        const available_models = needs_pick_ids.length
            ? Registry.get(effective_harness).models
            : [];
        const supports_effort = needs_pick_ids.length
            ? Registry.supportsEffort(effective_harness)
            : false;

        const assignment_data = {
            plan_md: plan_md,
            history,
            active_workers,
            new_workers,
            new_issues: todos,
            harness_name: effective_harness,
            available_models,
            supports_effort,
            needs_model_pick_ids: needs_pick_ids,
        };
        const assignments: Assignment[] = await this.route_issues(assignment_data);
        log.info("model returned assignments", { count: assignments.length });

        // Resolved once per issue that needs materializing — the project's stored default when
        // it has one, otherwise the LLM's pick — but either way validated against the real
        // harness manifest and never trusted blindly (a stored default can go stale after a
        // harness's model list changes; a picked model can be hallucinated).
        const harness_supports_effort = Registry.supportsEffort(effective_harness);
        const fallback_model = Registry.get(effective_harness).models[0] ?? null;
        const resolved_configs = new Map<string, ResolvedConfig>();
        for (const issue of unconfigured) {
            const picked = default_model
                ? undefined
                : assignments.find((a) => a.issueId === issue.id);
            const candidate_model = default_model ?? picked?.model;
            const model =
                candidate_model && Registry.supportsModel(effective_harness, candidate_model)
                    ? candidate_model
                    : fallback_model;
            if (!model) continue; // harness has no models configured at all — nothing to snapshot

            const candidate_effort = default_model ? default_effort : picked?.effort;
            const effort = harness_supports_effort && candidate_effort ? candidate_effort : null;
            resolved_configs.set(issue.id, { harness: effective_harness, model, effort });
        }

        await prisma.$transaction(async (tx) => {
            for (const a of assignments) {
                const w = await tx.worker.update({
                    where: { id: a.workerId },
                    data: { nextQueuePos: { increment: 1 } },
                    select: { nextQueuePos: true },
                });
                await tx.issue.update({
                    where: { id: a.issueId },
                    data: {
                        assignerWorkerId: a.workerId,
                        queuePosition: w.nextQueuePos - 1,
                        specialization: a.specialization,
                        status: IssueStatus.Queued,
                    },
                });

                const resolved = resolved_configs.get(a.issueId);
                if (resolved) {
                    await tx.issueConfig.upsert({
                        where: { issueId: a.issueId },
                        create: { issueId: a.issueId, ...resolved },
                        // Never clobber — an explicit override that raced in between our
                        // pre-transaction snapshot and this write always wins.
                        update: {},
                    });
                }
            }
        });

        const worker_ids = [...new Set(assignments.map((a) => a.workerId))];
        await Promise.all(worker_ids.map((id) => queue.enqueue_dispatch(id)));
        log.success("routing complete", {
            project: projectId,
            queued: assignments.length,
            workers: worker_ids.length,
        });
    }

    static async spin_up_workers(
        projectId: string,
        active_worker_count: number,
        issue_count: number,
        maxWorkers: number,
    ): Promise<Worker[]> {
        const workers_to_create = Math.max(
            0,
            Math.min(issue_count, maxWorkers) - active_worker_count,
        );

        const new_workers: Worker[] = [];
        for (let i = 0; i < workers_to_create; i++) {
            const worker = await prisma.worker.create({
                data: {
                    projectId,
                    status: WorkerStatus.Booting,
                },
            });
            new_workers.push(worker);
        }

        if (new_workers.length > 0) {
            log.info("spun up new workers", { count: new_workers.length });
        }

        return new_workers;
    }

    static async route_issues(data: {
        plan_md: string;
        history: Map<string, Issue[]>;
        active_workers: Worker[];
        new_workers: Worker[];
        new_issues: Issue[];
        harness_name: Harness;
        available_models: string[];
        supports_effort: boolean;
        needs_model_pick_ids: string[];
    }): Promise<Assignment[]> {
        const model = new ChatAnthropic({
            apiKey: ENV.SERVER_ANTHROPIC_API_KEY,
            model: "claude-haiku-4-5-20251001",
        });

        const chain = RunnableSequence.from([
            routerPrompt,
            model.withStructuredOutput(ai_value, { strict: true }),
        ]);

        const active_workers_view = data.active_workers.map((worker) => ({
            id: worker.id,
            specialization: worker.specialization,
            status: worker.status,
            recentIssues: (data.history.get(worker.id) ?? []).map((issue) => ({
                id: issue.id,
                title: issue.title,
                status: issue.status,
            })),
        }));

        const new_workers_view = data.new_workers.map((worker) => ({
            id: worker.id,
            status: worker.status,
        }));

        const new_issues_view = data.new_issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            priority: issue.priority,
        }));

        log.step("asking the model to assign issues", {
            workers: active_workers_view.length + new_workers_view.length,
            issues: new_issues_view.length,
        });
        const result = await chain.invoke({
            plan_md: data.plan_md,
            active_worker_count: active_workers_view.length,
            active_workers: JSON.stringify(active_workers_view),
            new_worker_count: new_workers_view.length,
            new_workers: JSON.stringify(new_workers_view),
            new_issues: JSON.stringify(new_issues_view),
            harness_name: data.harness_name,
            available_models: JSON.stringify(data.available_models),
            supports_effort: String(data.supports_effort),
            needs_model_pick_ids: JSON.stringify(data.needs_model_pick_ids),
        });

        return result.assignments;
    }
}
