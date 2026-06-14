import { CommandResult, Sandbox, SnapshotInfo } from "e2b";
import { ENV } from "../configs/env";

export default class E2B {

    public static async create(): Promise<string> {
        const sandbox = await Sandbox.create('node-py-claude-template', {
            apiKey: ENV.SERVER_E2B_API_KEY,
        });


        return sandbox.sandboxId;

    }

    public static async exec_command(sandbox_id: string, command: string): Promise<CommandResult> {
        const sandbox = await Sandbox.connect(sandbox_id);
        const result = await sandbox.commands.run(command);
        return result;
    }

    public static async exec_js_code(sandbox_id: string, code: string) {
        const sandbox = await Sandbox.connect(sandbox_id);
        const result = await sandbox.commands.run(`node -e \"${code}\"`);
        console.log(result.stdout);
    }

    public static async take_snapshot(sandbox_id: string): Promise<SnapshotInfo> {
        const snapshot = await Sandbox.createSnapshot(sandbox_id);
        return snapshot;
    }

    public static async pause(sandbox_id: string): Promise<boolean> {
        const status = await Sandbox.pause(sandbox_id);
        return status;
    }

}
