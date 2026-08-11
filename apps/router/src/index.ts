import Logger from "@trymatcha/logger";
import InitServices from "./services/services.init";

export const router_services = new InitServices();

Logger.banner("matcha router", { listening: "route jobs" });
