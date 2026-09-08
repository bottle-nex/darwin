import type Logger from "@trydarwin/logger";
import chalk from "chalk";

const MAX_LINE = 160;
const CREDENTIAL_IN_URL = /\/\/[^/\s:@]+:[^/\s@]+@/g;

export function truncate(text: string, limit: number): string {
    const flat = text.replace(/\s+/g, " ").trim();
    return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

/**
 * Blank known secrets, then blank anything shaped like a credential in a URL.
 *
 * Two passes because they fail differently: the known-value pass cannot miss a format variant,
 * and the pattern pass still catches a credential nobody remembered to hand over.
 */
export function redact(text: string, secrets: string[]): string {
    const known = secrets.reduce(
        (out, secret) => (secret ? out.split(secret).join("***") : out),
        text,
    );
    return known.replace(CREDENTIAL_IN_URL, "//***:***@");
}

/**
 * Pull the readable part out of a failed sandbox command.
 *
 * E2B throws a CommandExitError whose message is only "exit status 1". The output that says what
 * actually broke sits on the error itself, so reading the message alone records nothing useful and
 * leaves a repair agent guessing.
 */
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

/**
 * Describe a failure well enough to act on it without reading the code that raised it.
 *
 * A failure is only useful when it says which step broke and what that step actually printed. The
 * stage supplies the first; command_error_text supplies the second. Redaction is not optional: the
 * git remote carries a live installation token, git echoes that URL back in its own fatal
 * messages, and these strings are written to the database.
 */
export function describe_failure(stage: string, error: unknown, secrets: string[]): FailureReport {
    return { stage, message: redact(command_error_text(error), secrets) };
}

export function failure_sentence(failure: FailureReport): string {
    return `${failure.stage}: ${failure.message}`;
}

export default class SandboxStream {
    /**
     * Turn e2b's chunk callbacks into whole lines.
     *
     * e2b hands over arbitrary byte chunks — one chunk can be half a line, three lines, or a
     * fragment mid-word — so the tail of every chunk is carried until its line completes.
     *
     * Splits on carriage returns as well as newlines: git reports clone progress by overwriting
     * a single line with `\r`, and a newline-only split would hold the whole clone in the buffer
     * and emit it as one line at the end.
     */
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

    /**
     * Mirror a command whose output is plain text, dimmed so sandbox output reads as background
     * behind darwin's own lines.
     *
     * `secrets` is not optional in spirit: clone_repo puts a live GitHub installation token in
     * the remote URL and git echoes that URL back in its own error messages, so anything
     * streaming a clone has to blank the token before it reaches the terminal.
     */
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
