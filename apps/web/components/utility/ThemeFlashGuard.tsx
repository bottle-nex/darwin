import { PLAYGROUND_THEME_STORAGE_KEY } from "@/store/playground/usePlaygroundThemeStore";

const script = `try{var s=JSON.parse(localStorage.getItem("${PLAYGROUND_THEME_STORAGE_KEY}")).state.scheme;var d=s==="system"?window.matchMedia("(prefers-color-scheme: dark)").matches:s!=="light";if(!d){document.currentScript.parentElement.classList.add("light");if(document.body)document.body.classList.add("light")}}catch(e){}`;

/**
 * Reads the stored scheme and stamps `light` on its own parent before the
 * browser paints. Render it as the first child of the element carrying
 * `.theme-playground`; `document.currentScript.parentElement` resolves to that
 * element because its opening tag is already parsed when this runs. Without
 * it, hydration would repaint the whole app on every hard load.
 */
export default function ThemeFlashGuard() {
    return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
