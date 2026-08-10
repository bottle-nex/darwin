import chalk from "chalk";
import { ENV } from "./src/conf/config.env";
import { InitServices } from "./src/services/service.init";

export const vm_services = new InitServices();
console.log(chalk.greenBright("VM services initialized — listening for onboard + dispatch jobs"));
console.log(
    chalk.greenBright(
        `  dispatch concurrency: ${ENV.SERVER_VM_DISPATCH_CONCURRENCY}, onboard concurrency: 1`,
    ),
);
