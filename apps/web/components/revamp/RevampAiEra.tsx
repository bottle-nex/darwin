import Link from "next/link";
import { cn } from "@/lib/utils";
import { landingContainer } from "./LandingSection";
import AsciiFanCanvas from "./AsciiFanCanvas";

const bracket = "pointer-events-none absolute size-6 border-neutral-600";

export default function RevampAiEra() {
    return (
        <section className="w-full bg-ink py-24 pt-35">
            <div className={cn(landingContainer, "flex flex-col items-center")}>
                <h2 className="font-serif text-snow text-center text-5xl md:text-7xl">
                    The all new AI Era
                </h2>
                <p className="text-snow/60 mt-5 max-w-md text-center text-lg leading-relaxed">
                    File an issue on the board — a matcha agent picks it up, ships the fix, and
                    opens the PR.
                </p>

                <div className="mt-8 flex items-center gap-3">
                    <Link
                        href="/why"
                        className="text-snow rounded-full border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-800"
                    >
                        Why us?
                    </Link>
                    <Link
                        href="/login"
                        className="bg-snow text-ink rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
                    >
                        Start now
                    </Link>
                </div>

                <div className="relative mt-14 w-full max-w-4xl">
                    <span className={cn(bracket, "top-0 left-0 border-t-2 border-l-2")} />
                    <span className={cn(bracket, "top-0 right-0 border-t-2 border-r-2")} />
                    <span className={cn(bracket, "bottom-0 left-0 border-b-2 border-l-2")} />
                    <span className={cn(bracket, "right-0 bottom-0 border-r-2 border-b-2")} />
                    <AsciiFanCanvas className="font-mono h-[34rem] w-full" />
                </div>
            </div>
        </section>
    );
}
