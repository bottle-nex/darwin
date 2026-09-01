"use client";
import type { ReactNode } from "react";

import { refractor } from "@/components/playground/Review/changes/diffLanguage";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { codeThemeVars } from "@/lib/codeThemes";

import type { LogDetail } from "./agentLog.registry";

type HastNode = {
    type: string;
    value?: string;
    tagName?: string;
    properties?: { className?: string[] };
    children?: HastNode[];
};

/**
 * Renders refractor's tree directly rather than through `dangerouslySetInnerHTML`.
 *
 * The tree is only ever class names and text, so building elements from it keeps command output
 * — which is whatever the repository's own tooling printed — out of the HTML parser.
 */
function render(nodes: HastNode[], keyPrefix = ""): ReactNode[] {
    return nodes.map((node, index) => {
        const key = `${keyPrefix}${index}`;
        if (node.type === "text") return node.value;
        return (
            <span key={key} className={node.properties?.className?.join(" ")}>
                {render(node.children ?? [], `${key}-`)}
            </span>
        );
    });
}

function highlight(code: string): ReactNode[] {
    try {
        const tree = refractor.highlight(code, "bash") as unknown as
            HastNode[] | { children: HastNode[] };
        return render(Array.isArray(tree) ? tree : tree.children);
    } catch {
        return [code];
    }
}

function Card({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="rounded-lg bg-black/25 px-3.5 py-3">
            <p className="text-[11.5px] text-snow/35">{label}</p>
            <div className="mt-2 font-mono text-[12px] leading-[21px] whitespace-pre-wrap text-snow/70">
                {children}
            </div>
        </div>
    );
}

export default function AgentLogDetail({ detail }: { detail: LogDetail }) {
    const { codeTheme } = useUserConfig();

    return (
        <div
            className="agent-log mt-1.5 flex flex-col gap-2 rounded-xl border border-snow/5 p-2"
            style={codeThemeVars(codeTheme)}
        >
            {detail.input && (
                <Card label={detail.input.label}>
                    <span className="break-all">{highlight(detail.input.text)}</span>
                </Card>
            )}
            {detail.output && (
                <Card label={detail.output.label}>
                    <div
                        data-lenis-prevent
                        className="no-scrollbar max-h-56 overflow-y-auto break-all"
                    >
                        {detail.output.text}
                    </div>
                </Card>
            )}
        </div>
    );
}
