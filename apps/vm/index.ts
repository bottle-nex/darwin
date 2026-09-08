import Logger from "@trydarwin/logger";

import { ENV } from "./src/conf/config.env";
import { start_run_log_server } from "./src/http/server.run_logs";
import { InitServices } from "./src/services/dispatch/service.init";

export const vm_services = new InitServices();

start_run_log_server();

Logger.banner("darwin vm", {
    listening: "onboard + dispatch",
    dispatch_concurrency: ENV.VM_DISPATCH_CONCURRENCY,
    onboard_concurrency: 1,
    run_log_port: ENV.VM_HTTP_PORT,
});
