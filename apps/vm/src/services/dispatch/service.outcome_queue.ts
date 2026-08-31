import { type IssueOutcomeJobData, QueueName } from "@trymatcha/types";
import { Queue } from "bullmq";

import queue_config from "../../conf/config.queue";

const queue = new Queue<IssueOutcomeJobData>(QueueName.IssueOutcome, queue_config);

export default class OutcomeReporter {
    static async publish(data: IssueOutcomeJobData): Promise<void> {
        await queue.add("outcome", data, {
            jobId: `outcome-${data.issueId}`,
            removeOnComplete: true,
            removeOnFail: false,
        });
    }
}
