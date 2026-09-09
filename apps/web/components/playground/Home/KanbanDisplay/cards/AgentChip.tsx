import { AgentIcon } from "@trydarwin/ui/icons";

/** Small chip showing the Claude model assigned to an issue. */
export default function AgentChip({ name }: { name: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-overlay/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300 ring-1 ring-overlay/10">
            <AgentIcon className="size-2.5 text-warning" aria-hidden />
            {name}
        </span>
    );
}
