import Link from "next/link";
import DitherStructureCanvas from "./DitherStructureCanvas";
import DitherHeroDashboard from "./DitherHeroDashboard";

const NAV_LINKS = ["Features", "Pricing", "Docs", "Blog"];

/** Four-point pinwheel star mark, rotated into an X. */
function StarMark() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-[clamp(1.25rem,1.6vw,2rem)] text-[#1c1c1c]"
            fill="currentColor"
        >
            <path
                d="M12 1.5 14.6 9.4 22.5 12 14.6 14.6 12 22.5 9.4 14.6 1.5 12 9.4 9.4Z"
                transform="rotate(45 12 12)"
            />
        </svg>
    );
}

const pillText = "text-[clamp(13px,0.9vw,17px)]";

export default function DitherHero() {
    return (
        <section className="w-full px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="font-grotesk relative w-full overflow-hidden rounded-xl bg-[#fbfbfa] text-[#1c1c1c] lg:h-[calc(100svh-3rem)] lg:min-h-[640px]">
                {/* Dithered isometric structure, cropped by the panel's top edge */}
                <DitherStructureCanvas className="absolute top-0 right-0 hidden h-full w-[55%] lg:block" />

                {/* Nav — the whole layout sits in a 16%–84% content frame */}
                <header className="relative z-10 flex items-center px-8 pt-8 lg:px-[16%] lg:pt-[5.5vh]">
                    <StarMark />
                    <nav
                        className={`ml-[8%] hidden items-center gap-[3.2vw] text-[#2a2a2a] md:flex ${pillText}`}
                    >
                        {NAV_LINKS.map((link) => (
                            <Link key={link} href="/" className="hover:opacity-60">
                                {link}
                            </Link>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-2.5">
                        <Link
                            href="/login"
                            className={`rounded-full bg-white px-5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_2px_6px_rgba(0,0,0,0.14)] ${pillText}`}
                        >
                            Login
                        </Link>
                        <Link
                            href="/login"
                            className={`rounded-full bg-[#141414] px-5 py-2 text-white transition-opacity hover:opacity-85 ${pillText}`}
                        >
                            Sign Up
                        </Link>
                    </div>
                </header>

                {/* Copy */}
                <div className="relative z-10 px-8 pt-14 lg:px-[16%] lg:pt-[9vh]">
                    <h1 className="text-[clamp(2.4rem,4.7vw,5.75rem)] leading-[1.1] font-medium tracking-[-0.025em]">
                        <span className="block">AI for teams</span>
                        <span className="block">shaping the future.</span>
                    </h1>
                    <p className="font-mono mt-[3vh] max-w-[38ch] text-[clamp(11px,0.92vw,17px)] leading-relaxed text-[#454545]">
                        Build, connect, and scale intelligent workflows — all from one place.
                    </p>
                    <Link
                        href="/login"
                        className={`mt-[4.5vh] inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white px-6 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.09)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.13)] ${pillText}`}
                    >
                        Get Started <span aria-hidden>›</span>
                    </Link>
                </div>

                {/* Product mock: same 16% frame, bleeding past the panel's bottom edge */}
                <DitherHeroDashboard className="relative z-10 mx-8 mt-14 -mb-4 lg:absolute lg:top-[49%] lg:right-[16%] lg:-bottom-4 lg:left-[16%] lg:mx-0 lg:mt-0 lg:mb-0" />
            </div>
        </section>
    );
}
