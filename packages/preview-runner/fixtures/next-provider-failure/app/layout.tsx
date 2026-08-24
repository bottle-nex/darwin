import { MissingProvider } from "unavailable-preview-provider";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
    return <MissingProvider>{children}</MissingProvider>;
}
