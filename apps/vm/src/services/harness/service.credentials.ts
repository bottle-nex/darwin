import type { Harness } from "@trymatcha/database";
import { CredentialSource, Registry } from "@trymatcha/harness";

import { ENV } from "../../conf/config.env";
import SecretService from "../platform/service.secret";

const PLATFORM_CREDENTIAL: Partial<Record<Harness, string | undefined>> = {
    Claude: ENV.VM_CLAUDE_CODE_OAUTH_TOKEN,
    Codex: ENV.VM_OPENAI_API_KEY,
    OpenCode: ENV.VM_OPENCODE_API_KEY,
};

/**
 * Resolves the one env var a harness's CLI needs to authenticate, per its declared
 * credentialSource — a platform-wide key/token, or a project's own BYOK secret.
 */
export async function resolve_harness_env(
    harness: Harness,
    project_id: string,
): Promise<Record<string, string>> {
    const agent = Registry.get(harness);

    if (agent.credentialSource === CredentialSource.PlatformKey) {
        const value = PLATFORM_CREDENTIAL[harness];
        if (!value) {
            throw new Error(`no platform credential configured for the ${harness} harness`);
        }
        return { [agent.credentialEnvVar]: value };
    }

    const secrets = await SecretService.get_all_secrets(project_id);
    const value = secrets[agent.credentialEnvVar];
    if (!value) {
        throw new Error(
            `project is missing the ${agent.credentialEnvVar} secret required by the ${harness} harness`,
        );
    }
    return { [agent.credentialEnvVar]: value };
}
