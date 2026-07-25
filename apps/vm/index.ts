import chalk from "chalk";
import { InitServices } from "./src/services/service.init";

export const vm_services = new InitServices();
console.log(chalk.greenBright("VM services initialized successfully!"));
