import { Sandbox } from "e2b";
import { PlanStatus, prisma } from "@trymatcha/database";
import { ENV } from "../configs/env";
import fs from "fs";
import path from "path";

const REPO_DIR = "/home/user/repo";
// const PLAN_DUMP_PATH = path.join(import.meta.dirname, "../../plan.md");
const PROMPT_PATH = "/home/user/brief_prompt.txt";
const AGENT_TIMEOUT_MS = 10 * 60_000;

const BRIEF_PROMPT = `Explore this repository and write a project brief for an autonomous coding agent that will later be handed an issue to fix in this codebase. That agent can read and grep the code itself — your job is to save it the cost of orienting.

Output GitHub-flavored markdown with exactly these sections, in this order:

## Stack & layout
The languages, frameworks, and package manager. How the repository is organised, and what lives where.

## Entry points
Where execution starts for each runnable piece, with file paths.

## Build, run, test
The exact commands, taken from the manifests and scripts you find. If there is no test runner, say so plainly rather than inventing one.

## Conventions
Formatting, naming, file layout, and error-handling patterns the code actually follows. Cite a representative file for each.

## Domain glossary
Terms that carry project-specific meaning, and what they refer to in the code.

Rules: describe only what you verified by reading files — never guess at a command or a convention. Cite file paths so the agent can jump straight there. Be specific and dense; skip preamble and closing remarks. Output the markdown document and nothing else.`;

interface AgentReport {
    result?: string;
    total_cost_usd: number;
    duration_ms: number;
    num_turns: number;
}

export interface BriefRun {
    planMd: string;
    model: string;
    effort: string;
    costUsd: number;
    durationMs: number;
    numTurns: number;
}

export default class PlanService {
    static async get_plan(project_id: string) {
        const project = await prisma.project.findUnique({
            where: { id: project_id },
            select: { planMd: true, planStatus: true },
        });

        if (!project) {
            console.error("Project not found");
            return;
        }

        if (!project.planMd || project.planStatus !== PlanStatus.Ready) {
            console.error("Plan not found or is not ready.");
            return;
        }

        return { planMd: project.planMd };
    }

    static async generate_plan(sandbox_id: string): Promise<BriefRun> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        await sandbox.files.write(PROMPT_PATH, BRIEF_PROMPT);

        const model = ENV.SERVER_BRIEF_MODEL;
        const effort = ENV.SERVER_BRIEF_EFFORT;
        console.log(`Generating plan with model ${model} and effort ${effort}`);
        const result = await sandbox.commands.run(
            `claude -p "$(cat ${PROMPT_PATH})" --model ${model} --effort ${effort} ` +
            `--output-format json --tools "Read,Glob,Grep,Bash" --permission-mode bypassPermissions`,
            {
                cwd: REPO_DIR,
                envs: { ANTHROPIC_API_KEY: ENV.SERVER_ANTHROPIC_API_KEY },
                timeoutMs: AGENT_TIMEOUT_MS,
            },
        );

        let report: AgentReport;
        try {
            report = JSON.parse(result.stdout);
        } catch {
            throw new Error(`onboarding agent did not return JSON: ${result.stderr}`);
        }
        console.log("report is :  ", report);
        const plan_md = report.result?.trim();
        // fs.writeFileSync(PLAN_DUMP_PATH, plan_md || "", "utf-8");
        if (!plan_md) {
            throw new Error(`onboarding agent produced an empty brief: ${result.stderr}`);
        }

        return {
            planMd: plan_md,
            model,
            effort,
            costUsd: report.total_cost_usd,
            durationMs: report.duration_ms,
            numTurns: report.num_turns,
        };
    }

    static async set_plan(project_id: string, plan_md: string, commit_sha: string) {
        await prisma.project.update({
            where: { id: project_id },
            data: {
                planMd: plan_md,
                planStatus: PlanStatus.Ready,
                planCommitSha: commit_sha,
                planGeneratedAt: new Date(),
            },
        });
    }

    static async mark_generating(project_id: string) {
        await prisma.project.update({
            where: { id: project_id },
            data: { planStatus: PlanStatus.Generating },
        });
    }

    static async mark_failed(project_id: string) {
        await prisma.project.update({
            where: { id: project_id },
            data: { planStatus: PlanStatus.Failed },
        });
    }
}
