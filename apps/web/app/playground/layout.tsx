import { TooltipProvider } from "@/components/ui/tooltip";
import AccessControlProvider from "@/context/context.access-control";

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
    return (
        <AccessControlProvider>
            <TooltipProvider>
                <div className="h-dvh overflow-hidden overscroll-none bg-[#141414]">{children}</div>
            </TooltipProvider>
        </AccessControlProvider>

    );
}
