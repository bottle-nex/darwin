import { expect, test } from "bun:test";

import {
    command_error_text,
    describe_failure,
    failure_sentence,
    redact,
    truncate,
} from "./service.sandbox_stream";

test("a failed command reports its output, not just its exit status", () => {
    const failure = Object.assign(new Error("exit status 1"), {
        exitCode: 1,
        stdout: "",
        stderr: `error during build:\n"Audiowide" is not exported by "shims/next-font.ts"`,
    });

    const text = command_error_text(failure);
    expect(text).toContain("Audiowide");
    expect(text).not.toBe("exit status 1");
});

test("stdout is used when a tool reports its failure there instead", () => {
    const failure = Object.assign(new Error("exit status 1"), {
        stdout: 'Invalid value for option "output.inlineDynamicImports"',
        stderr: "   ",
    });
    expect(command_error_text(failure)).toContain("inlineDynamicImports");
});

test("an ordinary error still yields its message", () => {
    expect(command_error_text(new Error("sandbox is gone"))).toBe("sandbox is gone");
});

test("secrets are blanked and long lines are trimmed", () => {
    expect(redact("token=abc123", ["abc123"])).toBe("token=***");
    expect(truncate("a".repeat(20), 10)).toHaveLength(10);
});

test("a failure names the step that broke and what it printed", () => {
    const failure = describe_failure(
        "push issue branch",
        Object.assign(new Error("exit status 1"), {
            stderr: "remote: Write access to repository not granted.\nfatal: unable to access",
        }),
        [],
    );

    expect(failure.stage).toBe("push issue branch");
    expect(failure.message).toContain("Write access to repository not granted");
    expect(failure_sentence(failure)).toBe(`push issue branch: ${failure.message}`);
});

test("a credential in command output never survives into the record", () => {
    const token = "ghs_liveinstallationtoken";
    const failure = describe_failure(
        "push issue branch",
        Object.assign(new Error("exit status 1"), {
            stderr: `fatal: unable to access 'https://x-access-token:${token}@github.com/acme/app/'`,
        }),
        [token],
    );

    expect(failure.message).not.toContain(token);
    expect(failure.message).toContain("***");
});

test("a credential nobody handed over is still blanked by shape", () => {
    const failure = describe_failure(
        "clone repo",
        Object.assign(new Error("exit status 128"), {
            stderr: "fatal: could not read from 'https://x-access-token:ghs_unknown@github.com/a/b'",
        }),
        [],
    );

    expect(failure.message).not.toContain("ghs_unknown");
});

test("a plain error still describes itself", () => {
    expect(describe_failure("open pull request", new Error("422 Validation Failed"), []).message).toBe(
        "422 Validation Failed",
    );
});
