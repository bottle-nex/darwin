import type RunLogWriter from "./service.writer";

type RegisteredRun = { writer: RunLogWriter; token: string };

/**
 * Holds the runs this worker is currently solving, so a report arriving over HTTP can be matched
 * to the buffer that owns it.
 *
 * Membership is the authorization: a run that this worker is not running has no entry, so a token
 * that was valid for some other sandbox cannot write into it.
 */
export default class RunLogRegistry {
    private static runs = new Map<string, RegisteredRun>();

    static register(run_id: string, writer: RunLogWriter, token: string): void {
        RunLogRegistry.runs.set(run_id, { writer, token });
    }

    static release(run_id: string): void {
        RunLogRegistry.runs.delete(run_id);
    }

    static resolve(run_id: string, token: string): RunLogWriter | null {
        const entry = RunLogRegistry.runs.get(run_id);
        if (!entry || entry.token !== token) return null;
        return entry.writer;
    }
}
