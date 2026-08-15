import Link from "next/link";

type EntryLink = { href: string; label: string };

type EntryNavProps = {
    previous?: EntryLink | undefined;
    next?: EntryLink | undefined;
};

function NavItem({ entry, direction }: { entry: EntryLink; direction: "Previous" | "Next" }) {
    return (
        <Link
            href={entry.href}
            className={`group flex max-w-[45%] flex-col gap-y-1.5 ${direction === "Next" ? "items-end text-right" : "items-start"}`}
        >
            <span className="font-mono text-[11px] tracking-widest text-mist/30 uppercase">
                {direction}
            </span>
            <span className="text-[15px] leading-snug text-mist/60 transition-colors group-hover:text-snow">
                {entry.label}
            </span>
        </Link>
    );
}

export function EntryNav({ previous, next }: EntryNavProps) {
    if (!previous && !next) return null;

    return (
        <nav className="flex items-start justify-between gap-x-8 border-t border-graphite pt-8">
            {previous ? <NavItem entry={previous} direction="Previous" /> : <span />}
            {next ? <NavItem entry={next} direction="Next" /> : <span />}
        </nav>
    );
}
