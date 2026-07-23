import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { cn } from "@/lib/utils";
import AppLogo from "./Applogo";

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
    Product: [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
        { label: "Integrations", href: "/integrations" },
        { label: "Changelog", href: "/changelog" },
    ],
    Company: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
    ],
    Resources: [
        { label: "Documentation", href: "/docs" },
        { label: "Help Center", href: "/help" },
        { label: "API Reference", href: "/docs/api" },
        { label: "Status", href: "/status" },
    ],
};

const LEGAL_LINKS: { label: string; href: string }[] = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
];

const TOP_EDGE =
    "M0 4a4 4 0 0 1 4-4h344.32c4.197 0 8.369.66 12.361 1.958l49.5 16.084A40 40 0 0 0 422.542 20h517.7c4.293 0 8.559-.691 12.633-2.047l47.785-15.906A40 40 0 0 1 1013.29 0H1356a4 4 0 0 1 4 4";

function FooterTopEdge({ isMarkettingPage = false }: { isMarkettingPage?: boolean }) {
    return (
        <div aria-hidden className="relative">
            <svg
                width="100%"
                height="20"
                viewBox="0 0 1360 20"
                fill="none"
                preserveAspectRatio="none"
                className="block w-full"
            >
                <path
                    d={`${TOP_EDGE}v16H0z`}
                    className={isMarkettingPage ? "fill-snow" : "fill-cement"}
                />
            </svg>
        </div>
    );
}

export function Footer({ isMarkettingPage = false }: { isMarkettingPage?: boolean }) {
    return (
        <footer className="relative">
            <FooterTopEdge isMarkettingPage={isMarkettingPage} />
            <div className={cn("relative pb-6", isMarkettingPage ? "bg-snow" : "bg-cement")}>
                <div className="relative mx-auto max-w-7xl px-6 pt-10 sm:pt-14">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-8">
                        <div className="col-span-2 md:col-span-2">
                            <div className="flex items-center gap-2">
                                <AppLogo
                                    className={isMarkettingPage ? "text-neutral-900" : "text-white"}
                                />
                            </div>
                            <p
                                className={cn(
                                    "mt-3 text-sm text-pretty max-w-xs",
                                    isMarkettingPage ? "text-neutral-600" : "text-white/80",
                                )}
                            >
                                The modern WhatsApp marketing platform for teams that want to grow.
                            </p>
                        </div>
                        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
                            <div key={heading}>
                                <div
                                    className={cn(
                                        "text-xs font-medium mb-3",
                                        isMarkettingPage ? "text-neutral-700" : "text-white",
                                    )}
                                >
                                    {heading}
                                </div>
                                <ul className="space-y-2">
                                    {links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                href={link.href}
                                                className={cn(
                                                    "group inline-flex items-center gap-0.5 text-sm transition-colors",
                                                    isMarkettingPage
                                                        ? "text-neutral-500 hover:text-neutral-900"
                                                        : "text-white/80 hover:text-white",
                                                )}
                                            >
                                                {link.label}
                                                <FiArrowUpRight className="size-3.5 -translate-y-px -translate-x-0.5 opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div
                        className={cn(
                            "mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 -mx-6 px-6",
                            "pt-6",
                            "text-xs",
                            isMarkettingPage ? "text-neutral-500" : "text-white/80",
                        )}
                    >
                        <div>© {new Date().getFullYear()} AIDM</div>
                        <div className="flex items-center gap-4">
                            {LEGAL_LINKS.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className={
                                        isMarkettingPage
                                            ? "hover:text-neutral-900"
                                            : "hover:text-white"
                                    }
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
