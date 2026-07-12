import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/providers/LenisProvider";
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
            className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
        >
            <LenisProvider>
                <body className="min-h-full flex flex-col">
                    <QueryProvider>{children}</QueryProvider>
                    <Toaster />
                </body>
                <SessionSetter session={session} />
            </LenisProvider>
        </html>
    );
}
