import { expect, mock, test } from "bun:test";
import type { Sandbox } from "e2b";

import PreviewServer, { type PreviewServerHandle } from "./service.preview_server";

test("stops the whole preview process group", async () => {
    const run = mock().mockResolvedValue({ exitCode: 0, stdout: "" });
    const sandbox = { commands: { run } } as unknown as Sandbox;
    const server = {
        url: "http://127.0.0.1:41337",
        healthPath: "/",
        logPath: "/home/user/preview/server.log",
        port: 41337,
        process: { pid: 1257, kill: mock() },
    } as unknown as PreviewServerHandle;

    await PreviewServer.stop(sandbox, server);

    expect(run).toHaveBeenCalledWith("kill -- -1257", { timeoutMs: 10_000 });
});
