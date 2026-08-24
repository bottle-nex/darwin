import { expect, test } from "bun:test";
import type { Sandbox } from "e2b";

import PreviewRunner from "./service.preview_runner";

function sandbox_with_runtime_version(version: number): Sandbox {
    return {
        commands: {
            run: async () => ({
                exitCode: 0,
                stdout: JSON.stringify({ version }),
            }),
        },
    } as unknown as Sandbox;
}

test("accepts the current preview-runner protocol and rejects an older snapshot", async () => {
    expect(await PreviewRunner.supports_current_protocol(sandbox_with_runtime_version(4))).toBe(
        true,
    );
    expect(await PreviewRunner.supports_current_protocol(sandbox_with_runtime_version(3))).toBe(
        false,
    );
});
