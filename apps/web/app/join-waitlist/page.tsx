import { Instrument_Serif } from "next/font/google";

import WaitlistHero from "@/components/join-waitlist/WaitlistHero";

const instrumentSerif = Instrument_Serif({
    variable: "--font-instrument-serif",
    subsets: ["latin"],
    weight: "400",
    style: ["normal", "italic"],
});

export default function JoinWaitlistPage() {
    return (
        <main className={`${instrumentSerif.variable} min-h-svh bg-white`}>
            <WaitlistHero />
        </main>
    );
}
