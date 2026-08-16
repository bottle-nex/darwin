import type { Metadata } from "next";
import {
    Arimo,
    Geist_Mono,
    Instrument_Serif,
    Inter_Tight,
    Poppins,
    Tektur,
    Titillium_Web,
} from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
    variable: "--font-poppins",
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const tektur = Tektur({
    variable: "--font-tektur",
    subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
    variable: "--font-instrument-serif",
    subsets: ["latin"],
    weight: ["400"],
});

const interTight = Inter_Tight({
    variable: "--font-inter-tight",
    subsets: ["latin"],
});

const arimo = Arimo({
    variable: "--font-arimo",
    subsets: ["latin"],
});

const titilliumWeb = Titillium_Web({
    variable: "--font-titillium-web",
    subsets: ["latin"],
    weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
    title: "matcha admin",
    description: "Internal content tooling for matcha.",
    robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${poppins.variable} ${geistMono.variable} ${tektur.variable} ${instrumentSerif.variable} ${interTight.variable} ${titilliumWeb.variable} ${arimo.variable} h-full antialiased`}
        >
            <body className="flex min-h-full flex-col">
                <QueryProvider>{children}</QueryProvider>
                <Toaster />
            </body>
        </html>
    );
}
