import { Sandbox } from "@e2b/code-interpreter";
import { ENV } from "../configs/env";

export default class E2B {

    public static async create() {
        const sandbox = await Sandbox.create({
            apiKey: ENV.SERVER_E2B_API_KEY,
        });
        const execution = await sandbox.runCode('print("Hellow world")');
        console.log("execution logs: ", execution.logs);

        const files = await sandbox.files.list('/');
        console.log("files: ", files);
    }
}