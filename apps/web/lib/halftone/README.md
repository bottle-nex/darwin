# halftone

A faithful port of [Twenty](https://twenty.com)'s hero background halftone — the
blue line-screen that renders on top of an image. Same shaders, framing, and
cursor hover-light as Twenty's site. You pass an image via `src`; it renders the
line-screen onto it.

Only dependency: [`three`](https://www.npmjs.com/package/three).

## Install (copy into your project)

Copy `lib/halftone/` (this folder: `hero-engine.ts`, `index.ts`, `react.tsx`) into
your repo, then:

```bash
bun add three   # or npm/yarn/pnpm
```

## React usage

```tsx
"use client";
import { Halftone } from "@/lib/halftone/react";

export default function Hero() {
    return (
        <div style={{ width: "100%", height: 600 }}>
            <Halftone src="/logo.png" ink="#4A38F5" />
        </div>
    );
}
```

The canvas fills this component's box — wrap it in a sized element.

**Next.js (App Router):** client component. Use inside another `"use client"`
component, or load from a server component with:

```tsx
import dynamic from "next/dynamic";
const Halftone = dynamic(() => import("@/lib/halftone/react").then((m) => m.Halftone), {
    ssr: false,
});
```

Export the current frame via a ref:

```tsx
const ref = useRef<HalftoneRef>(null);
<Halftone ref={ref} src="/logo.png" />
<button onClick={() => ref.current?.exportPNG("out.png")}>Export</button>
```

## Vanilla usage (no React)

```ts
import { createHalftone } from "@/lib/halftone";

const h = createHalftone(document.getElementById("box")!, { src: "/logo.png" });
h.update({ tile: 10, ink: "#4a38f5" });
h.setImage("/other.png");
h.exportPNG();
h.destroy();
```

`createHalftone` takes a **container element** (it appends its own `<canvas>`).

## Options

| option               | default     | meaning                                                     |
| -------------------- | ----------- | ----------------------------------------------------------- |
| `src` (required)     | —           | image URL / dataURL / public path                           |
| `ink`                | `#4A38F5`   | line color                                                  |
| `hoverColor`         | `#4A38F5`   | line color under the cursor                                 |
| `tile`               | `12`        | cell size px (smaller = finer/denser, heavier)              |
| `power`              | `-0.07`     | tone bias (`s_3`)                                           |
| `width`              | `0.34`      | line thickness (`s_4`)                                      |
| `contrast`           | `1`         | contrast applied to the source                              |
| `invert`             | `true`      | `applyToDarkAreas` — dark image areas become lines          |
| `cropToBounds`       | `true`      | only draw where the image is present                        |
| `hover`              | `true`      | cursor hover light (lines lengthen near the pointer)        |
| `hoverRadius`        | `0.14`      | glow radius as a fraction of canvas height                  |
| `hoverIntensity`     | `0.8`       | hover light intensity                                       |
| `previewDistance`    | `4`         | zoom = `4 / previewDistance` (Twenty's hero uses `3.2`)     |
| `verticalAnchor`     | `0.5`       | 0 bottom · 0.5 center · 1 top (for letterboxing)            |
| `horizontalOffsetPx` | `0`         | shift the sampled image horizontally                        |
| `verticalOffsetPx`   | `0`         | shift the sampled image vertically                          |

## Notes

- **Framing:** the image is fit by **width** (full horizontal span always
  visible); taller containers letterbox (use `verticalAnchor`), wider containers
  crop top/bottom. `previewDistance` < 4 zooms in.
- **Motion** is cursor-only (Twenty's hero has no ambient animation): a radial
  hover light lengthens the lines near the pointer, eased in/out.
- **Source images:** bold subjects with a clear light↔dark gradient look best;
  flat solid shapes render nearly uniform.
- **Cross-origin images** need CORS headers to be exportable (canvas taint).
- Mirrors Twenty's `use-home-background-halftone.ts` (shaders, `footprintScale`,
  hover easing) verbatim.
```
