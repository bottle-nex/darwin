import { cn } from "@/lib/utils";
import React from "react";

interface IconWrapperProps {
    icon: React.ReactElement<{ className?: string }>;
    stroke_color: string;
    bg_color: string;
}

export default function IconWrapper({ icon, stroke_color, bg_color }: IconWrapperProps) {
    return (
        <span className={cn(bg_color, "rounded-xs p-0.5")}>
            {React.cloneElement(icon, {
                className: cn(stroke_color, icon.props.className),
            })}
        </span>
    );
}
