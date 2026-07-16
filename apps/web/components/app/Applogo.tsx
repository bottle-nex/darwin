import { MatchaLogo } from "@/components/logo/MatchaLogo";

interface AppLogoProps {
    iconOnly?: boolean;
    className?: string;
    size?: number;
}

export default function AppLogo({ iconOnly = false, className = "", size = 24 }: AppLogoProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <MatchaLogo className="w-auto shrink-0" style={{ height: size }} />
            {!iconOnly && (
                <span className="text-xl font-semibold leading-none tracking-tight">
                    <span className="font-normal opacity-55">try</span>matcha
                    <span className="text-[#8B77EC]">.</span>
                </span>
            )}
        </div>
    );
}
