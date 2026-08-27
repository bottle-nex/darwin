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

        - these issue ids also need you to pick a model (and effort, if offered) for the {{ harness_name }} harness,
          choosing only from this list: {{ available_models }}. Effort is offered={{ supports_effort }} for this
          harness — only set effort if offered=true, using one of Low/Medium/High/XHigh/Max.
            {{ needs_model_pick_ids }}
          If this list is empty, ignore model/effort entirely for every assignment.
    `,
    inputVariables: [
        "plan_md",
        "active_worker_count",
        "active_workers",
        "new_worker_count",
        "new_workers",
        "new_issues",
        "harness_name",
        "available_models",
        "supports_effort",
        "needs_model_pick_ids",
    ],
    templateFormat: "mustache",
});
