import type { Metadata } from "next";
import { Geist_Mono, Google_Sans_Flex, Titillium_Web } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import SessionSetter from "@/components/utility/SessionSetter";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "next-auth";
import { authOption } from "./api/auth/[...nextauth]/options";

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const googleSansFlex = Google_Sans_Flex({
    variable: "--font-google-sans-flex",
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
            className={`${googleSansFlex.variable} ${geistMono.variable} ${titilliumWeb.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <QueryProvider>{children}</QueryProvider>
                <Toaster />
            </body>
            <SessionSetter session={session} />
        </html>
    );
}
