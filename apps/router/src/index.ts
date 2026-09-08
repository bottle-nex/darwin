import Logger from "@trydarwin/logger";
import InitServices from "./services/services.init";

export const router_services = new InitServices();

Logger.banner("darwin router", { listening: "route jobs" });
