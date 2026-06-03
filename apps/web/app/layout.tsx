import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/providers/LenisProvider";
import QueryProvider from "@/providers/QueryProvider";
import SessionSetter from "@/components/utility/SessionSetter";
import { getServerSession } from "next-auth";
import { authOption } from "./api/auth/[...nextauth]/options";

const poppins = Poppins({
    variable: "--font-poppins",
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
            className={`${poppins.variable} h-full antialiased`}
        >
            <LenisProvider>
                <body className="min-h-full flex flex-col">
                    <QueryProvider>{children}</QueryProvider>
                </body>
                <SessionSetter session={session} />
            </LenisProvider>
        </html>
    );
}
