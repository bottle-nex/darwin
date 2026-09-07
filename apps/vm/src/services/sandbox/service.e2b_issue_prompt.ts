import { ExecutionMode } from "@trymatcha/database";

import type { ClaimedIssue } from "../dispatch/service.issue_solver";
import { PR_BODY_PATH, REPO_DIR, SOLVE_REPORT_PATH } from "./service.e2b.constants";

export default class IssuePromptBuilder {
    public static build(
        issue: ClaimedIssue,
        base_branch: string,
        plan_md: string | null,
        dependencies_installed: boolean,
    ): string {
        const reopened = issue.reopenNote !== null;

        const intro = reopened
            ? `You are an autonomous coding agent working inside a clone of this repository at ${REPO_DIR}, on branch "${issue.prBranch}". This issue has been worked ${issue.attemptNumber - 1} time${issue.attemptNumber === 2 ? "" : "s"} already and its pull request is open. Someone read that work, found it wanting, and sent the issue back for another pass. Read the commits already on this branch before you change anything.`
            : `You are an autonomous coding agent working inside a fresh clone of this repository at ${REPO_DIR}, currently on branch "${issue.prBranch}".`;

        const brief = plan_md
            ? `## Project brief

            An earlier agent explored this repository and wrote the brief below. Lean on it to orient yourself instead of rediscovering the layout from scratch. It was written against an earlier commit, so confirm anything you depend on before acting on it.

            ${plan_md}`
            : null;

        const issue_section = `## Issue #${issue.number}: ${issue.title}

            ${issue.description}`;

        const history = issue.priorAttempts.length
            ? `## What earlier attempts did

            Each report below is a previous attempt's own account of this issue. Read the "Ruled out" sections before you start: they name the dead ends already walked, and repeating one spends the whole run learning what is written down here.

            ${issue.priorAttempts.map((attempt) => `### Attempt ${attempt.attemptNumber}\n\n${attempt.report}`).join("\n\n")}`
            : null;

        const follow_up = issue.reopenNote
            ? `## What to do now

            This is what the person who sent the issue back asked for. It is the job for this run — not the issue description, which describes work that is already committed on this branch.

            ${issue.reopenNote}

            Build on the commits already here. Do not start the issue over, and do not revert or rewrite earlier commits — the pull request keeps its whole history, and a reviewer is reading it.`
            : null;

        const actions = [
            reopened
                ? `Do what "What to do now" asks. Read the files it concerns, and the commits already on this branch, before changing anything.`
                : `Investigate the issue and read every relevant file before changing it.`,
            `Stay on the existing branch "${issue.prBranch}". Never switch branches or commit directly to "${base_branch}".`,
            `Implement the fix using your normal tools.`,
            ...(dependencies_installed
                ? [
                      `Run this repository's own lint and type-check scripts and fix what your change broke. They are the same checks its pre-push hook runs, and the push is rejected if they fail.`,
                  ]
                : []),
            `Commit your changes with a clear commit message.`,
            `Do not push the branch or open a pull request — that is handled for you once you finish.`,
            ...(issue.executionMode === ExecutionMode.Manual
                ? [
                      `This issue is being solved in manual mode. Where the issue is ambiguous about what the result should be, call the ask_user tool and wait for the answer instead of choosing for yourself.`,
                  ]
                : []),
            `Write a short markdown summary of your change to ${PR_BODY_PATH}. It becomes the pull request description.`,
            `Write your solve report to ${SOLVE_REPORT_PATH}, following the template below exactly.`,
        ];

        const manual_section =
            issue.executionMode === ExecutionMode.Manual
                ? `## Asking before you decide

            This issue is in manual mode: a person is standing by to answer you.

            Call the ask_user tool when the issue does not settle what the result should be — which of two reasonable behaviours is wanted, what a value should be, whether a case you found is in scope. Ask with a concrete question and options where there are options; it blocks until they answer, and if nobody answers in time you are told to use your own judgement.

            Ask about the outcome, never about permission to work. Reading files, editing them, running commands and committing are all yours to do without asking. A question about whether you may use a tool wastes the person's time; a question about what the fix should actually do is the reason they are there.

            Ask once for each decision and carry the answer forward. If you can settle it from the codebase, settle it and say so in your report rather than asking.`
                : null;

        const report = `## Your solve report

            ${SOLVE_REPORT_PATH} is the only place your reasoning survives. The person reading it later sees the files you changed and every command you ran, but never why — so write down what they cannot reconstruct.

            Use these five headings, exactly as written, in this order, and nothing else:

            ## The cause
            What was actually wrong. Two sentences at most.

            ## Where
            The files you touched, with line numbers.

            ## The fix, and why this one
            What you changed, and the other approach you considered and rejected. Say why you rejected it.

            ## Ruled out
            The dead ends. Files you read and left alone, causes you suspected and disproved, approaches that would not work in this codebase. This is the most valuable section: it is what stops the next person repeating your work. If you truly ruled nothing out, say so.

            ## How it was checked
            The commands you ran to verify the fix and what they returned. If you did not verify it, write "Not verified" and say what would need running. Never imply you checked something you did not.

            Every claim you make must name a real file, command, or commit from this run. A reader can compare your report against what you actually did, so a file you never opened or a command you never ran makes the whole report untrustworthy.

            This is not the pull request description. ${PR_BODY_PATH} tells a reviewer what changed; this tells a maintainer how you got there. Write both.`;

        const steps = `## What to do, in this exact order

            ${actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}

            Do all of this yourself with your Bash tool — you have full permissions in this sandbox.

            ${
                dependencies_installed
                    ? "This repository's dependencies are already installed, so its own scripts will run."
                    : "This repository's dependencies are not installed, and installing them here is not possible. Verify your change by reading the code rather than by running the project's tooling, and say plainly in your report that you could not run it."
            }

            Never run a package install of your own, whatever the reason. A partial install leaves some packages without their dependencies while still arming the repository's git hooks, and every push after that is rejected. If a tool you want is missing, say so in your report instead.

            ## Reporting your progress

            Someone is watching this run and sees only what you report. Call report_progress immediately after each action you take — every file you read, every file you edit or create, every search, and every command you run. Report the action, not its contents: the file changes and command output are shown separately, so send the path or the command and nothing more. An action you do not report did not happen as far as the person watching is concerned.

            When you report a command, give it a title: a short plain sentence naming what you were trying to achieve, never what you typed — "Retry GitHub API for profile", not "run curl". Send the command and the output you got back with it. The person watching sees only that title until they open it, so a title that just repeats the command tells them nothing.

            Use kind "notice" to record a decision the reader could not guess: a file you deliberately left alone and why, something you ruled out, a constraint you found in their code. Not a running commentary — a note is for a conclusion that would otherwise be invisible to someone who only sees the files you changed.

            Before you turn to a new part of the work, report it with kind "step" and say the goal in one short plain sentence — "Finding where the navbar tiles are defined", not "Calling Grep". The person reading never sees your reasoning, so a step is the only place they learn what you are trying to do, and it is what makes the actions underneath it make sense. Expect roughly five to ten steps across this whole run: a step marks a change of intent, never a single file or command.

            Never start a long-running command in the background and end your turn waiting on it. This is a single non-interactive run: there is no later turn to come back to, so anything left running when you stop is lost and the issue goes unsolved. Run it in the foreground and wait for it to finish.`;

        return [intro, brief, issue_section, history, follow_up, steps, manual_section, report]
            .filter(Boolean)
            .join("\n\n");
    }
}
