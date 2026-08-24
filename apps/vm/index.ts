import Logger from "@trymatcha/logger";

import { ENV } from "./src/conf/config.env";
import { InitServices } from "./src/services/service.init";

export const vm_services = new InitServices();

Logger.banner("matcha vm", {
    listening: "onboard + dispatch",
    dispatch_concurrency: ENV.SERVER_VM_DISPATCH_CONCURRENCY,
    onboard_concurrency: 1,
});
