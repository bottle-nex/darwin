import type { ReactNode } from "react";

export default function PropertyGroup({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-y-2">
            <h2 className="text-[13px] text-neutral-500 ml-2.5">{title}</h2>
            <div className="flex flex-col items-start gap-y-1">{children}</div>
        </section>
    );
}
