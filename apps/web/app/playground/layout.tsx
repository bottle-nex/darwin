import { TooltipProvider } from "@/components/ui/tooltip";
import AccessControlProvider from "@/context/context.access-control";
import {
    SIDEBAR_MAX_WIDTH,
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_PANEL_WIDTH_CSS_VAR,
    SIDEBAR_WIDTH_CSS_VAR,
    SIDEBAR_WIDTH_STORAGE_KEY,
} from "@/store/playground/useSidebarWidthStore";
import {
    GLOW_OPACITY_VAR,
    GLOW_RGB_VAR,
    GLOW_STORAGE_KEY,
    GLOW_X_VAR,
    GLOW_Y_VAR,
} from "@/lib/backgroundLighting";

const restoreSidebarWidthScript = `try{var s=JSON.parse(localStorage.getItem("${SIDEBAR_WIDTH_STORAGE_KEY}")).state;var w=Math.min(${SIDEBAR_MAX_WIDTH},Math.max(${SIDEBAR_MIN_WIDTH},s.width));var r=document.documentElement.style;r.setProperty("${SIDEBAR_WIDTH_CSS_VAR}",(s.collapsed?0:w)+"px");r.setProperty("${SIDEBAR_PANEL_WIDTH_CSS_VAR}",w+"px")}catch(e){}`;

const restoreGlowScript = `try{var g=JSON.parse(localStorage.getItem("${GLOW_STORAGE_KEY}"));var r=document.documentElement.style;var a=g.angle*Math.PI/180;r.setProperty("${GLOW_RGB_VAR}",g.rgb);r.setProperty("${GLOW_OPACITY_VAR}",g.enabled?"1":"0");r.setProperty("${GLOW_X_VAR}",(50+Math.cos(a)*55)+"%");r.setProperty("${GLOW_Y_VAR}",(50+Math.sin(a)*55)+"%")}catch(e){}`;

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
    return (
        <AccessControlProvider>
            <TooltipProvider>
                <script dangerouslySetInnerHTML={{ __html: restoreSidebarWidthScript }} />
                <script dangerouslySetInnerHTML={{ __html: restoreGlowScript }} />
                <div className="theme-playground h-dvh overflow-hidden overscroll-none bg-ink">
                    {children}
                </div>
            </TooltipProvider>
        </AccessControlProvider>
    );
}
