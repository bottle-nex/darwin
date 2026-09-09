"use client";
import { isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

import MermaidDiagram from "./MermaidDiagram";

function textOf(node: ReactNode): string {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(textOf).join("");
    return "";
}

const COMPONENTS: Components = {
    h1: ({ children }) => (
        <h1 className="mt-6 mb-2 text-[15px] font-semibold text-neutral-100 first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="mt-6 mb-2 text-[13px] font-semibold tracking-wide text-neutral-200 uppercase first:mt-0">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="mt-5 mb-1.5 text-[13px] font-semibold text-neutral-200 first:mt-0">
            {children}
        </h3>
    ),
    p: ({ children }) => <p className="my-2.5 leading-relaxed text-neutral-400">{children}</p>,
    ul: ({ children }) => (
        <ul className="my-2.5 ml-4 list-disc space-y-1 text-neutral-400 marker:text-neutral-600">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="my-2.5 ml-4 list-decimal space-y-1 text-neutral-400 marker:text-neutral-600">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        >
            {children}
        </a>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-neutral-200">{children}</strong>
    ),
    em: ({ children }) => <em className="text-neutral-300 italic">{children}</em>,
    blockquote: ({ children }) => (
        <blockquote className="my-3 border-l-2 border-primary/30 pl-3 text-neutral-500 italic">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-4 border-border" />,
    code: ({ className, children }) => {
        if (/language-mermaid/.test(className ?? "")) {
            return <MermaidDiagram source={textOf(children).trimEnd()} />;
        }
        const isBlock = /language-/.test(className ?? "");
        return (
            <code
                className={cn(
                    "font-mono text-[12px]",
                    isBlock
                        ? "text-neutral-300"
                        : "rounded bg-overlay/6 px-1.5 py-0.5 text-primary",
                )}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => {
        if (isMermaidBlock(children)) return <>{children}</>;
        return (
            <pre className="surface-sunken my-3 overflow-x-auto rounded-md p-3 leading-[1.6]">
                {children}
            </pre>
        );
    },
    table: ({ children }) => (
        <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-left">{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border-b border-border px-2 py-1.5 text-[12px] font-semibold text-neutral-300">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border-b border-border-subtle px-2 py-1.5 text-neutral-400">{children}</td>
    ),
};

function isMermaidBlock(children: ReactNode): boolean {
    if (!isValidElement<{ className?: string }>(children)) return false;
    return /language-mermaid/.test(children.props.className ?? "");
}

/** Renders GitHub-flavored markdown styled for the playground surfaces. */
export default function Markdown({
    children,
    className,
}: {
    children: string;
    className?: string;
}) {
    return (
        <div className={cn("text-[13.25px] text-neutral-400", className)}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
                {children}
            </ReactMarkdown>
        </div>
    );
}
