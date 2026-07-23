"use client";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

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
            className="text-violet-300 underline decoration-violet-300/30 underline-offset-2 hover:decoration-violet-300"
        >
            {children}
        </a>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-neutral-200">{children}</strong>
    ),
    em: ({ children }) => <em className="text-neutral-300 italic">{children}</em>,
    blockquote: ({ children }) => (
        <blockquote className="my-3 border-l-2 border-violet-400/30 pl-3 text-neutral-500 italic">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-4 border-white/5" />,
    code: ({ className, children }) => {
        const isBlock = /language-/.test(className ?? "");
        return (
            <code
                className={cn(
                    "font-mono text-[12px]",
                    isBlock
                        ? "text-neutral-300"
                        : "rounded bg-white/6 px-1.5 py-0.5 text-violet-200",
                )}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="my-3 overflow-x-auto rounded-md bg-black/30 p-3 leading-[1.6] shadow-[inset_0_1px_0_0_#262626]">
            {children}
        </pre>
    ),
    table: ({ children }) => (
        <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-left">{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border-b border-white/10 px-2 py-1.5 text-[12px] font-semibold text-neutral-300">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border-b border-white/5 px-2 py-1.5 text-neutral-400">{children}</td>
    ),
};

/** Renders GitHub-flavored markdown styled for the dark playground surfaces. */
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
