// Public API — a faithful Twenty-hero halftone renderer.
// Give it a container element + an image `src`; it renders the line-screen
// onto your image (fit-by-width, hover light, identical shaders to Twenty).
//
//   import { createHalftone } from "@/lib/halftone";
//   const h = createHalftone(containerEl, { src: "/logo.png" });
//   h.update({ tile: 10, ink: "#4a38f5" });
//   h.destroy();
//
// React: import { Halftone } from "@/lib/halftone/react".
// Only dependency: three.

export { createHalftone, type HalftoneInstance, type HalftoneOptions } from "./hero-engine";
export {
    createHalftoneShape,
    type HalftoneShapeInstance,
    type HalftoneShapeOptions,
} from "./shape-engine";
