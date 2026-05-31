import { TooltipProvider } from "@/components/ui/tooltip";

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider>
			<div className="h-dvh overflow-hidden overscroll-none bg-[#141414]">{children}</div>
		</TooltipProvider>
	);
}
