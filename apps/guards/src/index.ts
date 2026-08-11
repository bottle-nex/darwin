import Logger from "@trymatcha/logger";
import "./config/config.env";
import Reconciler, { RECONCILE_INTERVAL_MS } from "./services/reconciler";
import { InitServices } from "./services/service.init";

export const guard_services = new InitServices();

Logger.banner("matcha guards", {
    sweeping_every: `${RECONCILE_INTERVAL_MS / 1000}s`,
    silent_unless: "repair needed",
});
Reconciler.start_sweeper();
setInterval(() => Reconciler.start_sweeper(), RECONCILE_INTERVAL_MS);
