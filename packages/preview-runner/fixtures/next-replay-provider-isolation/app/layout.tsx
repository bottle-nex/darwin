import "./styles.css";
import { FixtureProvider } from "./providers";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <FixtureProvider>{children}</FixtureProvider>
            </body>
        </html>
    );
}
