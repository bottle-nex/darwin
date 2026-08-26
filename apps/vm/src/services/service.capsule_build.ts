import type Logger from "@trymatcha/logger";
import type { Sandbox } from "e2b";

import { app_root, type CapsuleRevision, harness_dir } from "./service.capsule_harness";
import type { AppProfile } from "./service.capsule_workspace";

const REPO_DIR = "/home/user/repo";
const DIST_ROOT = "/home/user/dist";
const CARRY_DIR = "/home/user/matcha-carry";
const BUILD_TIMEOUT_MS = 8 * 60_000;
const MAX_BUILD_ERROR_CHARS = 2000;

export interface BuildOutcome {
    ok: boolean;
    error: string | null;
}

export function dist_dir(revision: CapsuleRevision): string {
    return `${DIST_ROOT}/${revision}`;
}

export function build_command(revision: CapsuleRevision): string {
    return `npx vite build --outDir ${dist_dir(revision)} --emptyOutDir`;
}

export function checkout_steps(profile: AppProfile, sha: string): string[] {
    const matcha = `${app_root(profile)}/.matcha`;
    return [
        `rm -rf ${CARRY_DIR}`,
        `if [ -d ${matcha} ]; then mv ${matcha} ${CARRY_DIR}; fi`,
        `git checkout --force ${sha}`,
        `mkdir -p ${app_root(profile)}`,
        `if [ -d ${CARRY_DIR} ]; then mv ${CARRY_DIR} ${matcha}; fi`,
    ];
}

export function trim_build_error(message: string): string {
    return message.length <= MAX_BUILD_ERROR_CHARS
        ? message
        : message.slice(-MAX_BUILD_ERROR_CHARS);
}

export default class CapsuleBuild {
    public static async build_revision(
        sandbox: Sandbox,
        profile: AppProfile,
        revision: CapsuleRevision,
        sha: string,
        log: Logger,
    ): Promise<BuildOutcome> {
        log.step(`building the ${revision} revision`, { sha: sha.slice(0, 8) });

        for (const step of checkout_steps(profile, sha)) {
            await sandbox.commands.run(step, { cwd: REPO_DIR });
        }

        try {
            await sandbox.commands.run(build_command(revision), {
                cwd: harness_dir(profile),
                timeoutMs: BUILD_TIMEOUT_MS,
            });
            return { ok: true, error: null };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            log.warn(`the ${revision} revision did not build`);
            return { ok: false, error: trim_build_error(message) };
        }
    }
}
