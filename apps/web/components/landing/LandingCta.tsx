import { NavCtaArrowIcon } from "@trydarwin/ui/icons";

import { landingContainer } from "./LandingSection";

export default function LandingCta() {
    return (
        <section className="w-full bg-ink py-20">
            <div className={landingContainer}>
                <div className="flex flex-col gap-y-8 rounded-md border border-edge bg-snow px-10 py-10 shadow-[0_18px_40px_-24px_rgba(24,24,27,0.1)] md:flex-row md:items-end md:justify-between md:gap-x-10">
                    <div>
                        <p className="font-mono text-[13px] tracking-[0.18em] text-muted-foreground uppercase">
                            One board / every pull request
                        </p>
                        <h2 className="mt-5 font-pixel text-[2.75rem]/none text-foreground">
                            Start with one issue.
                        </h2>
                        <p className="mt-5 text-[15px] text-muted-foreground">
                            File it on the board, watch the agent work, review the pull request.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="inline-flex h-11 cursor-pointer items-center gap-x-3 rounded-lg bg-linear-to-b from-[#2b2b2b] via-[#2b2b2b] to-neutral-700 px-5 text-[14px] font-medium text-snow shadow-[0_3px_0_0_#151516,0_8px_16px_-6px_rgba(24,24,27,0.35)] transition-all duration-150 hover:bg-[#343435] active:translate-y-[2px] active:shadow-[0_1px_0_0_#151516,0_3px_6px_-4px_rgba(24,24,27,0.35)]"
                    >
                        Get started
                        <NavCtaArrowIcon className="size-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}
