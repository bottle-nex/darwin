import { expect, test } from "bun:test";
import type { Sandbox } from "e2b";

import E2B, { requires_agent_run } from "./services.e2b";

test("runs the branch push through E2B with a ten-minute command timeout", async () => {
    let command = "";
    let timeoutMs = 0;
    const sandbox = {
        commands: {
            run: async (value: string, options: { timeoutMs: number }) => {
                command = value;
                timeoutMs = options.timeoutMs;
                return { exitCode: 0, stdout: "", stderr: "" };
            },
        },
    } as unknown as Sandbox;

    await E2B.push_issue_branch(sandbox, "matcha/issue-123", []);

    expect(command).toBe("git push origin matcha/issue-123");
    expect(timeoutMs).toBe(10 * 60_000);
});

test("reports a failed E2B branch push so the worker can retain its sandbox", async () => {
    const sandbox = {
        commands: {
            run: async () => {
                throw Object.assign(new Error("exit status 1"), {
                    exitCode: 1,
                    stdout: "",
                    stderr: "pre-push lint failed",
                });
            },
        },
    } as unknown as Sandbox;

    await expect(E2B.push_issue_branch(sandbox, "matcha/issue-123", [])).rejects.toThrow(
        "could not push branch matcha/issue-123 — pre-push lint failed",
    );
});

test("a push failure says what git said, not just that it exited non-zero", async () => {
    const sandbox = {
        commands: {
            run: async () => {
                throw Object.assign(new Error("exit status 1"), {
                    exitCode: 1,
                    stdout: "",
                    stderr: "remote: Write access to repository not granted.\nfatal: unable to access",
                });
            },
        },
    } as unknown as Sandbox;

    const failure = await E2B.push_issue_branch(sandbox, "matcha/issue-123", []).catch(
        (error: Error) => error.message,
    );

    expect(failure).toContain("Write access to repository not granted");
    expect(failure).not.toBe("could not push branch matcha/issue-123 — exit status 1");
});

test("a push failure never leaks the credential baked into the remote", async () => {
    const token = "ghs_liveinstallationtoken";
    const sandbox = {
        commands: {
            run: async () => {
                throw Object.assign(new Error("exit status 1"), {
                    exitCode: 1,
                    stdout: "",
                    stderr: `fatal: unable to access 'https://x-access-token:${token}@github.com/a/b/'`,
                });
            },
        },
    } as unknown as Sandbox;

    const failure = await E2B.push_issue_branch(sandbox, "matcha/issue-123", [token]).catch(
        (error: Error) => error.message,
    );

    expect(failure).not.toContain(token);
});

test("origin is re-pointed at the token minted for this dispatch", async () => {
    let command = "";
    const sandbox = {
        commands: {
            run: async (value: string) => {
                command = value;
                return { exitCode: 0, stdout: "", stderr: "" };
            },
        },
    } as unknown as Sandbox;

    await E2B.refresh_origin(sandbox, "https://github.com/acme/app", "ghs_fresh");

    expect(command).toBe(
        "git remote set-url origin https://x-access-token:ghs_fresh@github.com/acme/app",
    );
});

test("a failure while re-pointing origin does not leak the new token", async () => {
    const sandbox = {
        commands: {
            run: async () => {
                throw Object.assign(new Error("exit status 128"), {
                    exitCode: 128,
                    stdout: "",
                    stderr: "fatal: not a git repository https://x-access-token:ghs_fresh@github.com/a/b",
                });
            },
        },
    } as unknown as Sandbox;

    const failure = await E2B.refresh_origin(sandbox, "https://github.com/a/b", "ghs_fresh").catch(
        (error: Error) => error.message,
    );

    expect(failure).toContain("refresh origin:");
    expect(failure).not.toContain("ghs_fresh");
});

test("does not rerun Claude when a committed issue resumes before its branch is pushed", () => {
    expect(requires_agent_run(false, false, new Date("2026-08-26T00:00:00.000Z"))).toBe(false);
});

test("runs Claude for an unstarted issue branch", () => {
    expect(requires_agent_run(false, false, null)).toBe(true);
});
