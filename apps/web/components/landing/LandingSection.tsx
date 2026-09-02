import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const landingContainer = "mx-auto w-full max-w-[1300px]";

type LandingSectionProps = {
    children: ReactNode;
    className?: string;
};

export default function LandingSection({ children, className }: LandingSectionProps) {
    return (
        <section className="w-full bg-ink py-20">
            <div className={cn(landingContainer, className)}>{children}</div>
        </section>
    );
}
