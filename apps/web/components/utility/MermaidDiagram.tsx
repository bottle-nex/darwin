"use client";
import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

type Rendered = { source: string; svg: string | null };

export default function MermaidDiagram({
    source,
    className,
}: {
    source: string;
    className?: string;
}) {
    const [rendered, setRendered] = useState<Rendered | null>(null);
    const domId = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

    useEffect(() => {
        let active = true;

        import("mermaid")
            .then(async ({ default: mermaid }) => {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    darkMode: true,
                    securityLevel: "strict",
                    fontFamily: "inherit",
                    themeVariables: { background: "transparent", fontSize: "13px" },
                });
                const { svg } = await mermaid.render(domId, source);
                if (active) setRendered({ source, svg });
            })
            .catch(() => {
                if (active) setRendered({ source, svg: null });
            });

        return () => {
            active = false;
        };
    }, [source, domId]);

    const current = rendered?.source === source ? rendered : null;

    if (!current) return <div className="my-3 h-24 animate-pulse rounded-md bg-[#0c0c0c]" />;

    if (!current.svg) {
        return (
            <pre className="my-3 overflow-x-auto rounded-md bg-overlay/6 p-3 font-mono text-[12px] text-neutral-400">
                {source}
            </pre>
        );
    }

    return (
        <div
            className={cn(
                "my-3 overflow-x-auto rounded-md bg-[#0c0c0c] p-3 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full",
                className,
            )}
            dangerouslySetInnerHTML={{ __html: current.svg }}
        />
    );
}
