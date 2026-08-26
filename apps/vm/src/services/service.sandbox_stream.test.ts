import { expect, test } from "bun:test";

import { command_error_text, redact, truncate } from "./service.sandbox_stream";

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
        stdout: "Invalid value for option \"output.inlineDynamicImports\"",
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
