import Pill from "@/components/ui/Pill";
import { cn } from "@/lib/utils";

const BOT_SUFFIX = "[bot]";

export default function GithubActorName({
    login,
    className,
}: {
    login: string | undefined;
    className?: string;
}) {
    if (!login) return <>Unknown</>;

    const isBot = login.endsWith(BOT_SUFFIX);

    return (
        <span className={cn("inline-flex items-center gap-1.5", className)}>
            {isBot ? login.slice(0, -BOT_SUFFIX.length) : login}
            {isBot && (
                <Pill tone="faint" size="sm" className="font-medium">
                    bot
                </Pill>
            )}
        </span>
    );
}
