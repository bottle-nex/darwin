import { TooltipProvider } from "@/components/ui/tooltip";
import AccessControlProvider from "@/context/context.access-control";
import {
    SIDEBAR_MAX_WIDTH,
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_WIDTH_CSS_VAR,
    SIDEBAR_WIDTH_STORAGE_KEY,
} from "@/store/playground/useSidebarWidthStore";

const restoreSidebarWidthScript = `try{var w=JSON.parse(localStorage.getItem("${SIDEBAR_WIDTH_STORAGE_KEY}")).state.width;if(typeof w==="number")document.documentElement.style.setProperty("${SIDEBAR_WIDTH_CSS_VAR}",Math.min(${SIDEBAR_MAX_WIDTH},Math.max(${SIDEBAR_MIN_WIDTH},w))+"px")}catch(e){}`;

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
    return (
        <AccessControlProvider>
            <TooltipProvider>
                <script dangerouslySetInnerHTML={{ __html: restoreSidebarWidthScript }} />
                <div className="h-dvh overflow-hidden overscroll-none bg-ink">{children}</div>
            </TooltipProvider>
        </AccessControlProvider>
    );
}
