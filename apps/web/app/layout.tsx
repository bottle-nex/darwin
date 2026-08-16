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
import SessionSetter from "@/components/utility/SessionSetter";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "next-auth";
import { authOption } from "./api/auth/[...nextauth]/options";

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
    title: "Matcha",
    description: "The modern WhatsApp marketing platform for teams that want to grow.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOption);

    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${poppins.variable} ${geistMono.variable} ${tektur.variable} ${instrumentSerif.variable} ${interTight.variable} ${titilliumWeb.variable} ${arimo.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <QueryProvider>{children}</QueryProvider>
                <Toaster />
            </body>
            <SessionSetter session={session} />
        </html>
    );
}
