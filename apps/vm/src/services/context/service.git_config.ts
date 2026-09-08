import type Sandbox from "e2b";

import GraphService from "./service.graph";

const GIT_AGENT_NAME = "darwin";
const GIT_AGENT_EMAIL = "agent@heydarwin.app";

export default class GitConfig {
    static async configure(sandbox: Sandbox): Promise<void> {
        await GraphService.run_checked(
            sandbox,
            `git config --global user.name "${GIT_AGENT_NAME}"`,
        );
        await GraphService.run_checked(
            sandbox,
            `git config --global user.email "${GIT_AGENT_EMAIL}"`,
        );
    }
}
