"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
    return (
        <Sonner
            theme="dark"
            position="bottom-right"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast bg-charcoal text-neutral-100 border border-white/10 rounded-lg",
                    description: "text-neutral-400",
                    actionButton: "bg-neutral-100 text-neutral-900",
                    cancelButton: "bg-white/5 text-neutral-300",
                },
            }}
            {...props}
        />
    );
}

export { Toaster };
