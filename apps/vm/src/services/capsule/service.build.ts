import type Logger from "@trydarwin/logger";
import type { Sandbox } from "e2b";

import { command_error_text } from "../sandbox/service.stream";
import CapsuleHarness, { app_root, type CapsuleRevision, harness_dir } from "./service.harness";
import type { AppProfile } from "./service.workspace";

const REPO_DIR = "/home/user/repo";
const DIST_ROOT = "/home/user/dist";
const CARRY_DIR = "/home/user/darwin-carry";
const BUILD_TIMEOUT_MS = 6 * 60_000;
const MAX_BUILD_ERROR_CHARS = 2000;

export interface BuildOutcome {
    ok: boolean;
    error: string | null;
}

export function dist_dir(revision: CapsuleRevision): string {
    return `${DIST_ROOT}/${revision}`;
}

export function build_command(revision: CapsuleRevision): string {
    return `npx vite build --outDir ${dist_dir(revision)}`;
}

export function checkout_steps(profile: AppProfile, sha: string): string[] {
    const darwin = `${app_root(profile)}/.darwin`;
    return [
        `rm -rf ${CARRY_DIR}`,
        `if [ -d ${darwin} ]; then mv ${darwin} ${CARRY_DIR}; fi`,
        `git checkout --force ${sha}`,
        `mkdir -p ${app_root(profile)}`,
        `if [ -d ${CARRY_DIR} ]; then mv ${CARRY_DIR} ${darwin}; fi`,
    ];
}

export function trim_build_error(message: string): string {
    return message.length <= MAX_BUILD_ERROR_CHARS
        ? message
        : message.slice(-MAX_BUILD_ERROR_CHARS);
}

export default class CapsuleBuild {
    public static async checkout_revision(
        sandbox: Sandbox,
        profile: AppProfile,
        revision: CapsuleRevision,
        sha: string,
        log: Logger,
    ): Promise<void> {
        log.step(`checking out the ${revision} revision`, { sha: sha.slice(0, 8) });

        for (const step of checkout_steps(profile, sha)) {
            await sandbox.commands.run(step, { cwd: REPO_DIR });
        }
        await sandbox.commands.run(
            `rm -rf ${dist_dir(revision)} && mkdir -p ${dist_dir(revision)}`,
        );
    }

    public static async build_capsule(
        sandbox: Sandbox,
        profile: AppProfile,
        revision: CapsuleRevision,
        capsule_id: string,
    ): Promise<BuildOutcome> {
        await CapsuleHarness.write_config(sandbox, profile, capsule_id, revision);

        try {
            await sandbox.commands.run(build_command(revision), {
                cwd: harness_dir(profile),
                timeoutMs: BUILD_TIMEOUT_MS,
            });
            return { ok: true, error: null };
        } catch (error) {
            return { ok: false, error: trim_build_error(command_error_text(error)) };
        }
    }
}
