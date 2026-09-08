import type { Metadata } from "next";
import { Geist_Mono, Google_Sans_Flex, Titillium_Web } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

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
    title: "darwin admin",
    description: "Internal content tooling for darwin.",
    robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${googleSansFlex.variable} ${geistMono.variable} ${titilliumWeb.variable} h-full antialiased`}
        >
            <body className="flex min-h-full flex-col">
                <QueryProvider>{children}</QueryProvider>
                <Toaster />
            </body>
        </html>
    );
}
