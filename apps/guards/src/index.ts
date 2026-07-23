import "./config/config.env";
import Reconciler, { RECONCILE_INTERVAL_MS } from "./services/reconciler";
import { InitServices } from "./services/service.init";

export const guard_services = new InitServices();

console.log("starting the reconciler service");
Reconciler.start_sweeper();
setInterval(() => {
    console.log("reconciler triggered");
    Reconciler.start_sweeper()
}, RECONCILE_INTERVAL_MS);
