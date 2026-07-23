import { PromptTemplate } from "@langchain/core/prompts";

export const routerPrompt = new PromptTemplate({
    template: `
        you are a master in segregating issues into their workers
        you just have to align the right issue into the right worker

        - this is the context of the repo
            {{plan_md}}
        - there are a total of {{ active_worker_count }} workers with their associated issues
            {{ active_workers }}
        - there are a total of {{ new_worker_count }} new and fresh workers
            {{ new_workers }}
        - these are the new issues that need to be mapped to their respective workers
            {{ new_issues }}

        NOTE: there is a chance that in resolved issues worker id is not found in present, as workers are killed after sometime of no use
    `,
    inputVariables: [
        "plan_md",
        "active_worker_count",
        "active_workers",
        "new_worker_count",
        "new_workers",
        "new_issues",
    ],
    templateFormat: "mustache",
});
