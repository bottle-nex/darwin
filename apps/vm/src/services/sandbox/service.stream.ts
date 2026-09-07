import type Logger from "@trydarwin/logger";
import chalk from "chalk";

const MAX_LINE = 160;
const CREDENTIAL_IN_URL = /\/\/[^/\s:@]+:[^/\s@]+@/g;

export function truncate(text: string, limit: number): string {
    const flat = text.replace(/\s+/g, " ").trim();
    return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

// Blanks known secrets first, then anything shaped like a credential in a URL — the pattern pass catches what the known-value pass misses.
export function redact(text: string, secrets: string[]): string {
    const known = secrets.reduce(
        (out, secret) => (secret ? out.split(secret).join("***") : out),
        text,
    );
    return known.replace(CREDENTIAL_IN_URL, "//***:***@");
}

// Pulls the readable failure text out of a command error, since E2B's CommandExitError message is just "exit status 1".
export function command_error_text(error: unknown): string {
    const result = error as { stderr?: unknown; stdout?: unknown; exitCode?: unknown };
    const parts = [result?.stderr, result?.stdout]
        .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
        .map((part) => part.trim());

    if (parts.length > 0) return parts.join("\n");
    return error instanceof Error ? error.message : String(error);
}

export interface FailureReport {
    stage: string;
    message: string;
}

// Describes a failure well enough to act on without reading code: names the stage and the command's own output, both redacted since these strings get written to the database.
export function describe_failure(stage: string, error: unknown, secrets: string[]): FailureReport {
    return { stage, message: redact(command_error_text(error), secrets) };
}

export function failure_sentence(failure: FailureReport): string {
    return `${failure.stage}: ${failure.message}`;
}

export default class SandboxStream {
    // Turns e2b's arbitrary byte-chunk callbacks into whole lines, splitting on \r too since git overwrites a line with carriage returns during clone progress.
    public static lines() {
        let remainder = "";

        return {
            push(chunk: string): string[] {
                const parts = (remainder + chunk).split(/\r\n|\r|\n/);
                remainder = parts.pop() ?? "";
                return parts.filter((line) => line.trim());
            },
            flush(): string[] {
                const tail = remainder;
                remainder = "";
                return tail.trim() ? [tail] : [];
            },
        };
    }

<<<<<<< HEAD
    /**
     * Mirror a command whose output is plain text, dimmed so sandbox output reads as background
     * behind darwin's own lines.
     *
     * `secrets` is not optional in spirit: clone_repo puts a live GitHub installation token in
     * the remote URL and git echoes that URL back in its own error messages, so anything
     * streaming a clone has to blank the token before it reaches the terminal.
     */
=======
    // Mirrors plain-text command output dimmed as background noise, blanking secrets since clone_repo's URL carries a live token that git echoes back on error.
>>>>>>> b6fcad70 (updated e2b related files.)
    public static plain(log: Logger, secrets: string[] = []) {
        const emit = (line: string) =>
            log.stream(chalk.dim(truncate(redact(line, secrets), MAX_LINE)));
        const stdout = SandboxStream.lines();
        const stderr = SandboxStream.lines();

        return {
            onStdout: (chunk: string) => stdout.push(chunk).forEach(emit),
            onStderr: (chunk: string) => stderr.push(chunk).forEach(emit),
            flush: () => {
                stdout.flush().forEach(emit);
                stderr.flush().forEach(emit);
            },
        };
    }
}
