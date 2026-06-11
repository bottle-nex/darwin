import "./config/env";
import Reconciler, { RECONCILE_INTERVAL_MS } from "./services/reconciler";

console.log("starting the reconciler service");
Reconciler.start_sweeper();
setInterval(() => Reconciler.start_sweeper(), RECONCILE_INTERVAL_MS);
