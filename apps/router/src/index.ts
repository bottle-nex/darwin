import chalk from "chalk";
import InitServices from "./services/services.init";

export const router_services = new InitServices();
console.log(chalk.greenBright("Router service initialized — listening for route jobs"));
