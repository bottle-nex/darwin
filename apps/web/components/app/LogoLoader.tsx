import AppLogo from "@/components/app/Applogo";
import { cn } from "@/lib/utils";

export default function LogoLoader({
    size = 44,
    className = "",
}: {
    size?: number;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-1 items-center justify-center", className)}>
            <AppLogo iconOnly size={size} className="animate-pulse" />
        </div>
    );
}
