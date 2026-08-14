import type { IconType } from "react-icons";
import { RiSendPlaneFill } from "react-icons/ri";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
    badge: string;
    /** Pill icon, one per section. Defaults to the send plane. */
    icon?: IconType;
    title: string;
    description?: string;
    className?: string;
};

/** Centered landing-section header: badge pill, serif title, muted description. */
export default function SectionHeader({
    badge,
    icon: Icon = RiSendPlaneFill,
    title,
    description,
    className,
}: SectionHeaderProps) {
    return (
        <div className={cn("mx-auto flex max-w-2xl flex-col items-center text-center", className)}>
            <span
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5"
                style={{
                    background: "linear-gradient(180deg, #232327, #131316)",
                    boxShadow:
                        "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 20px -10px rgba(0, 0, 0, 0.8)",
                }}
            >
                <Icon className="size-3.5 text-snow" />
                <span className="text-xs font-medium tracking-wide text-neutral-200">{badge}</span>
            </span>
            <h2 className="mt-6 text-4xl tracking-tight text-snow font-serif md:text-6xl">
                {title}
            </h2>
            {description && (
                <p className="mt-4 max-w-lg text-base leading-relaxed text-balance text-neutral-500 md:text-xl">
                    {description}
                </p>
            )}
        </div>
    );
}
