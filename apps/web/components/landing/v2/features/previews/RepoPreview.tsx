import { MdCheck, MdDescription, MdFolder, MdIntegrationInstructions } from "react-icons/md";
import { type IconType } from "react-icons";
import { cn } from "@/lib/utils";

type Node = { label: string; icon: IconType; indent: number; file?: boolean; tone: string };

const TREE: Node[] = [
    { label: "apps/web", icon: MdFolder, indent: 0, tone: "text-indigo-500" },
    {
        label: "app/layout.tsx",
        icon: MdIntegrationInstructions,
        indent: 1,
        file: true,
        tone: "text-sky-500",
    },
    { label: "components/board", icon: MdFolder, indent: 1, tone: "text-indigo-500" },
    {
        label: "lib/utils.ts",
        icon: MdIntegrationInstructions,
        indent: 1,
        file: true,
        tone: "text-sky-500",
    },
    {
        label: "CONVENTIONS.md",
        icon: MdDescription,
        indent: 0,
        file: true,
        tone: "text-neutral-400",
    },
];

/** Stagger the "read" checkmarks so files resolve top-to-bottom on hover. */
const DELAY = ["delay-0", "delay-100", "delay-200", "delay-300", "delay-[400ms]"];

export default function RepoPreview() {
    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                {TREE.map((node, i) => {
                    const Icon = node.icon;
                    return (
                        <div
                            key={node.label}
                            className="flex items-center gap-1.5 text-neutral-600"
                            style={{ paddingLeft: node.indent * 14 }}
                        >
                            <Icon
                                className={cn("size-3 shrink-0 fill-current", node.tone)}
                                aria-hidden
                            />
                            <span className="truncate">{node.label}</span>
                            {node.file && (
                                <MdCheck
                                    className={cn(
                                        "ml-auto size-3 shrink-0 text-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none",
                                        DELAY[i],
                                    )}
                                    aria-hidden
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
