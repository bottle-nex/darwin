import type { ProductDiffDiagnostic } from "@trymatcha/types";
import type Logger from "@trymatcha/logger";
import type { Sandbox } from "e2b";

import type { ProductDiffRevision, ProductDiffWorkspacePlan } from "./adapter.contract";
import type { NextPreviewLaunchPlan } from "./adapters/next/service.next_preview_launcher";
import NextPreviewSurface from "./adapters/next/service.next_preview_surface";
import { preview_check_summary } from "./service.preview_check_summary";
import PreviewRunner, {
    type CaptureRequest,
    type PreviewCapture,
    type PreviewSurface,
} from "../service.preview_runner";
import PreviewServer, { type PreviewServerHandle } from "../service.preview_server";

const PREVIEW_SERVER_UNAVAILABLE_MESSAGE = "The preview server did not become ready.";
const PREVIEW_SURFACE_UNAVAILABLE_MESSAGE = "The preview surface could not be prepared.";
const STARTUP_SUMMARY_MAX_LENGTH = 500;

export interface PreviewHealth {
    ok: boolean;
    diagnostic: ProductDiffDiagnostic | null;
}

export interface ProductDiffPreviewLifecycleRevision {
    revision: ProductDiffRevision;
    server: PreviewServerHandle | null;
    surface: PreviewSurface | null;
    health: PreviewHealth;
}

function diagnostic(
    workspacePlan: ProductDiffWorkspacePlan,
    code: string,
    stage: string,
    message: string,
): ProductDiffDiagnostic {
    return {
        code,
        stage,
        message,
        adapter: "next",
        applicationPath: workspacePlan.applicationPath,
        workspaceKind: workspacePlan.workspaceKind,
    };
}

function browser_failure_message(
    revision: ProductDiffRevision,
    results: Awaited<ReturnType<typeof PreviewRunner.check>>["results"],
    routePath: string,
): string {
    const failed = results.find((result) => !result.ok);
    return preview_check_summary(revision, failed, routePath);
}

function startup_failure_summary(logTail: string): string {
    const candidate = logTail
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .find((line) =>
            /(cannot find module|can't resolve|module not found|failed to compile|syntaxerror|typeerror|referenceerror|eaddrinuse|error:)/i.test(
                line,
            ),
        );
    if (!candidate) return "No recognized startup error was emitted before the readiness timeout.";
    return candidate
        .replace(
            /(authorization|cookie|password|token|secret|api[_-]?key)\s*[:=]\s*(?:bearer\s+)?[^\s,;]+/gi,
            "$1=[redacted]",
        )
        .slice(0, STARTUP_SUMMARY_MAX_LENGTH);
}

function redact_startup_log(value: string): string {
    return value
        .replace(/([a-z][a-z0-9+.-]*:\/\/)[^/\s@]+@/gi, "$1[redacted]@")
        .replace(
            /"(authorization|cookie|password|token|secret|api[_-]?key|database[_-]?url|redis[_-]?url|connection[_-]?string)"\s*:\s*"[^"]*"/gi,
            '"$1":"[redacted]"',
        )
        .replace(
            /(authorization|cookie|password|token|secret|api[_-]?key|database[_-]?url|redis[_-]?url|connection[_-]?string)\s*[:=]\s*(?:bearer\s+)?[^\s,;]+/gi,
            "$1=[redacted]",
        )
        .slice(-2_000);
}

export default class ProductDiffPreviewLifecycle {
    static async start_and_verify(input: {
        sandbox: Sandbox;
        log: Logger;
        revision: ProductDiffRevision;
        workspaceRoot: string;
        workspacePlan: ProductDiffWorkspacePlan;
        launchPlan: NextPreviewLaunchPlan;
        runId: string;
    }): Promise<ProductDiffPreviewLifecycleRevision> {
        let server: PreviewServerHandle | null = null;
        let surface: PreviewSurface | null = null;

        try {
            surface = await NextPreviewSurface.create(
                input.sandbox,
                input.workspaceRoot,
                input.workspacePlan,
                input.runId,
            );
            server = await PreviewServer.start(input.sandbox, input.launchPlan);
            if (
                !(await PreviewServer.wait_until_ready(
                    input.sandbox,
                    server,
                    input.log,
                    `${surface.routePath}/__ready__`,
                ))
            ) {
                const startup = await PreviewServer.runtime_diagnostics(
                    input.sandbox,
                    server,
                    `${surface.routePath}/__ready__`,
                );
                input.log.warn("preview startup failed", {
                    revision: input.revision,
                    applicationPath: input.workspacePlan.applicationPath,
                    workspaceKind: input.workspacePlan.workspaceKind,
                    port: server.port,
                    healthPath: server.healthPath,
                    launchCommand: input.launchPlan.command,
                    workingDirectory: input.launchPlan.workingDirectory,
                    serverProcessId: server.process.pid,
                    startupSummary: startup_failure_summary(startup.logTail),
                    startupLogTail: redact_startup_log(startup.logTail),
                    listenerSnapshot: redact_startup_log(startup.listenerSnapshot),
                    processSnapshot: redact_startup_log(startup.processSnapshot),
                    memorySnapshot: redact_startup_log(startup.memorySnapshot),
                    processGroupSnapshot: redact_startup_log(startup.processGroupSnapshot),
                    httpProbeSnapshot: redact_startup_log(startup.httpProbeSnapshot),
                    diskSnapshot: redact_startup_log(startup.diskSnapshot),
                });
                return {
                    revision: input.revision,
                    server,
                    surface,
                    health: {
                        ok: false,
                        diagnostic: diagnostic(
                            input.workspacePlan,
                            "PREVIEW_SERVER_UNAVAILABLE",
                            "startup",
                            PREVIEW_SERVER_UNAVAILABLE_MESSAGE,
                        ),
                    },
                };
            }

            const check = await PreviewRunner.check(input.sandbox, {
                baseUrl: server.url,
                routePath: surface.routePath,
                workspaceRoot: input.workspaceRoot,
                nextAppDir: input.workspacePlan.applicationPath,
            });
            if (!check.ok) {
                const failed = check.results.find((result) => !result.ok);
                const startup = await PreviewServer.runtime_diagnostics(
                    input.sandbox,
                    server,
                    `${surface.routePath}/__ready__`,
                );
                input.log.warn("preview browser validation failed", {
                    revision: input.revision,
                    applicationPath: input.workspacePlan.applicationPath,
                    workspaceKind: input.workspacePlan.workspaceKind,
                    port: server.port,
                    serverProcessId: server.process.pid,
                    launchCommand: input.launchPlan.command,
                    workingDirectory: input.launchPlan.workingDirectory,
                    routePath: surface.routePath,
                    targetId: failed?.targetId ?? "unknown",
                    stateId: failed?.stateId ?? "unknown",
                    problem: failed?.problem ?? "Unknown",
                    httpStatus: failed?.httpStatus ?? null,
                    detail: redact_startup_log(failed?.detail ?? ""),
                    startupLogTail: redact_startup_log(startup.logTail),
                    listenerSnapshot: redact_startup_log(startup.listenerSnapshot),
                    processSnapshot: redact_startup_log(startup.processSnapshot),
                    memorySnapshot: redact_startup_log(startup.memorySnapshot),
                    processGroupSnapshot: redact_startup_log(startup.processGroupSnapshot),
                    httpProbeSnapshot: redact_startup_log(startup.httpProbeSnapshot),
                    diskSnapshot: redact_startup_log(startup.diskSnapshot),
                });
                return {
                    revision: input.revision,
                    server,
                    surface,
                    health: {
                        ok: false,
                        diagnostic: diagnostic(
                            input.workspacePlan,
                            "PREVIEW_BROWSER_VALIDATION_FAILED",
                            "browser-validation",
                            browser_failure_message(
                                input.revision,
                                check.results,
                                surface.routePath,
                            ),
                        ),
                    },
                };
            }

            return {
                revision: input.revision,
                server,
                surface,
                health: { ok: true, diagnostic: null },
            };
        } catch {
            return {
                revision: input.revision,
                server,
                surface,
                health: {
                    ok: false,
                    diagnostic: diagnostic(
                        input.workspacePlan,
                        "PREVIEW_SURFACE_UNAVAILABLE",
                        "preview-surface",
                        PREVIEW_SURFACE_UNAVAILABLE_MESSAGE,
                    ),
                },
            };
        }
    }

    static async capture_verified(
        sandbox: Sandbox,
        preview: ProductDiffPreviewLifecycleRevision,
        request: CaptureRequest,
    ): Promise<PreviewCapture> {
        if (!preview.health.ok) {
            throw new Error("preview browser validation failed");
        }
        return PreviewRunner.capture(sandbox, request);
    }

    static async cleanup_revision(
        sandbox: Sandbox,
        preview: ProductDiffPreviewLifecycleRevision,
    ): Promise<void> {
        try {
            if (preview.server) await PreviewServer.stop(sandbox, preview.server);
        } finally {
            await NextPreviewSurface.remove(sandbox, preview.surface);
        }
    }
}
