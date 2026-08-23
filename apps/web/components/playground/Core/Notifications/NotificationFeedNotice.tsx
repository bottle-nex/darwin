"use client";
import { Button } from "@/components/ui/button";

export default function NotificationFeedNotice({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <p className="text-[12.5px] text-neutral-400">{message}</p>
            {onRetry && (
                <Button variant="tertiary" size="sm" onClick={onRetry}>
                    Try again
                </Button>
            )}
        </div>
    );
}
