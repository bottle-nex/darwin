import { CLAUDE_PRIMARY } from "./data";
import { ClaudeLogo } from "./ClaudeLogo";

export function AgentChip({ name }: { name: string }) {
    return (
        <span
            style={{ backgroundColor: CLAUDE_PRIMARY }}
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
        >
            <ClaudeLogo className="h-2.5 w-2.5" />
            {name}
        </span>
    );
}
