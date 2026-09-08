import { AppLogo as AppLogoMark } from "@/components/logo/AppLogo";
import { cn } from "@/lib/utils";

interface AppLogoProps {
    iconOnly?: boolean;
    className?: string;
    size?: number;
    textSize?: number;
}

export default function AppLogo({
    iconOnly = false,
    className = "",
    size = 24,
    textSize,
}: AppLogoProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <AppLogoMark className="w-auto shrink-0" style={{ height: size }} />
            {!iconOnly && (
                <span
                    className={cn("text-xl font-semibold leading-none tracking-tight")}
                    style={{ fontSize: textSize }}
                >
                    <span className="font-normal opacity-55">try</span>darwin
                    <span className="text-primary">.</span>
                </span>
            )}
        </div>
    );
}
