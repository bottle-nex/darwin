import type { ReactNode } from "react";

export function SharedBanner({ children }: { children: ReactNode }) {
    return <section className="shared-banner">{children}</section>;
}
