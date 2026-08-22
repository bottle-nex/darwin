import type { Metadata } from "next";
import { Geist_Mono, Google_Sans_Flex, JetBrains_Mono, Titillium_Web } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import SessionSetter from "@/components/utility/SessionSetter";
import ThemeScope from "@/components/utility/ThemeScope";
import { Toaster } from "@/components/utility/Toast";
import { getServerSession } from "next-auth";
import { authOption } from "./api/auth/[...nextauth]/options";

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
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
            className={`${googleSansFlex.variable} ${geistMono.variable} ${jetBrainsMono.variable} ${titilliumWeb.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <ThemeScope />
                <QueryProvider>{children}</QueryProvider>
                <Toaster />
            </body>
            <SessionSetter session={session} />
        </html>
    );
}
