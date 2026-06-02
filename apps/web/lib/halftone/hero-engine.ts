// Faithful port of Twenty's hero background halftone, as a reusable engine.
// Same shaders / framing / hover easing as
// twenty's src/sections/Hero/visuals/hooks/use-home-background-halftone.ts.
//
// You give it a container element + an image `src`; it mounts a <canvas> and
// renders the line-screen onto your image. Only dependency: three.

import * as THREE from "three";

const REFERENCE_PREVIEW_DISTANCE = 4;
const VIRTUAL_RENDER_HEIGHT = 768;
const MIN_FOOTPRINT_SCALE = 0.001;

export type HalftoneOptions = {
    /** Image to render (URL / dataURL / public path). */
    src: string;
    ink?: string; // dashColor (Twenty: #4A38F5)
    hoverColor?: string; // ink under the cursor
    tile?: number; // cell size px (Twenty: 12)
    power?: number; // s_3 tone bias (Twenty: -0.07)
    width?: number; // s_4 line thickness (Twenty: 0.34)
    contrast?: number; // source contrast (Twenty: 1)
    invert?: boolean; // applyToDarkAreas (Twenty: true)
    cropToBounds?: boolean; // only draw where the image is present (Twenty: true)
    hover?: boolean; // cursor hover light (Twenty: true)
    hoverRadius?: number; // glow radius as fraction of height (Twenty: 0.14)
    hoverIntensity?: number; // hover light intensity (Twenty: 0.8)
    // framing (Twenty fits by width; these tune zoom/anchor/offset)
    previewDistance?: number; // zoom = 4 / previewDistance (Twenty hero: 3.2)
    verticalAnchor?: number; // 0 bottom · 0.5 center · 1 top
    horizontalOffsetPx?: number;
    verticalOffsetPx?: number;
};

const DEFAULTS: Required<Omit<HalftoneOptions, "src">> = {
    ink: "#4A38F5",
    hoverColor: "#4A38F5",
    tile: 12,
    power: -0.07,
    width: 0.34,
    contrast: 1,
    invert: true,
    cropToBounds: true,
    hover: true,
    hoverRadius: 0.14,
    hoverIntensity: 0.8,
    previewDistance: REFERENCE_PREVIEW_DISTANCE, // = zoom 1 (whole image, fit by width)
    verticalAnchor: 0.5,
    horizontalOffsetPx: 0,
    verticalOffsetPx: 0,
};

const HOVER_VERTICAL_FADE = 0.5;
const HOVER_FADE_IN = 18;
const HOVER_FADE_OUT = 7;
const POINTER_FOLLOW = 0.38;

const passThroughVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const imagePassthroughFragmentShader = `
  precision highp float;
  uniform sampler2D tImage;
  uniform vec2 imageSize;
  uniform vec2 viewportSize;
  uniform float zoom;
  uniform float contrast;
  uniform float verticalPixelOffset;
  uniform float horizontalPixelOffset;
  uniform float verticalAnchor;
  varying vec2 vUv;
  void main() {
    float imageAspect = imageSize.x / imageSize.y;
    float viewAspect = viewportSize.x / viewportSize.y;
    vec2 uv = vUv;
    uv.y = (uv.y - verticalAnchor) * (imageAspect / viewAspect) + verticalAnchor;
    uv = (uv - 0.5) / zoom + 0.5;
    uv.y += verticalPixelOffset / max(viewportSize.y, 1.0);
    uv.x -= horizontalPixelOffset / max(viewportSize.x, 1.0);
    float inBounds = step(0.0, uv.x) * step(uv.x, 1.0)
                   * step(0.0, uv.y) * step(uv.y, 1.0);
    vec4 color = texture2D(tImage, clamp(uv, 0.0, 1.0));
    vec3 contrastColor = clamp((color.rgb - 0.5) * contrast + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(contrastColor, inBounds);
  }
`;

const halftoneFragmentShader = `
  precision highp float;
  uniform sampler2D tScene;
  uniform vec2 effectResolution;
  uniform vec2 logicalResolution;
  uniform float tile;
  uniform float s_3;
  uniform float s_4;
  uniform float applyToDarkAreas;
  uniform vec3 dashColor;
  uniform vec3 hoverDashColor;
  uniform float footprintScale;
  uniform vec2 interactionUv;
  uniform float hoverLightStrength;
  uniform float hoverLightRadius;
  uniform float hoverVerticalFade;
  uniform float cropToBounds;
  varying vec2 vUv;

  float distSegment(in vec2 p, in vec2 a, in vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float denom = max(dot(ba, ba), 0.000001);
    float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
    return length(pa - ba * h);
  }
  float lineSimpleEt(in vec2 p, in float r, in float thickness) {
    vec2 a = vec2(0.5) + vec2(-r, 0.0);
    vec2 b = vec2(0.5) + vec2(r, 0.0);
    float distToSegment = distSegment(p, a, b);
    float halfThickness = thickness * r;
    return distToSegment - halfThickness;
  }

  void main() {
    if (cropToBounds > 0.5) {
      vec4 boundsCheck = texture2D(tScene, vUv);
      if (boundsCheck.a < 0.01) { gl_FragColor = vec4(0.0); return; }
    }
    vec2 fragCoord =
      (gl_FragCoord.xy / max(effectResolution, vec2(1.0))) * logicalResolution;
    float halftoneSize = max(tile * max(footprintScale, 0.001), 1.0);
    vec2 pointerPx = interactionUv * logicalResolution;
    float fragDist = length(fragCoord - pointerPx);

    float hoverLightMask = 0.0;
    if (hoverLightStrength > 0.0) {
      float lightRadiusPx = hoverLightRadius * logicalResolution.y;
      hoverLightMask = smoothstep(lightRadiusPx, 0.0, fragDist);
      float fadeRange = max(hoverVerticalFade, 0.0001);
      hoverLightMask *=
        smoothstep(0.0, fadeRange, vUv.y) * smoothstep(0.0, fadeRange, 1.0 - vUv.y);
    }

    vec2 cellIndex = floor(fragCoord / halftoneSize);
    vec2 sampleUv = clamp((cellIndex + 0.5) * halftoneSize / logicalResolution, vec2(0.0), vec2(1.0));
    vec2 cellUv = fract(fragCoord / halftoneSize);

    vec4 sceneSample = texture2D(tScene, sampleUv);
    float mask = smoothstep(0.02, 0.08, sceneSample.a);
    float localPower = clamp(s_3, -1.5, 1.5);
    float localWidth = clamp(s_4, 0.05, 1.4);
    float lightLift = hoverLightStrength * hoverLightMask * 0.22;
    float toneValue = (sceneSample.r + sceneSample.g + sceneSample.b) * (1.0 / 3.0);
    if (applyToDarkAreas > 0.5) { toneValue = 1.0 - toneValue; }
    float bandRadius = clamp(toneValue + localPower * length(vec2(0.5)) + lightLift, 0.0, 1.0) * 1.86 * 0.5;

    float alpha = 0.0;
    if (bandRadius > 0.0001) {
      float signedDistance = lineSimpleEt(cellUv, bandRadius, localWidth);
      alpha = (1.0 - smoothstep(0.0, 0.02, signedDistance)) * mask;
    }
    vec3 activeDashColor = mix(dashColor, hoverDashColor, hoverLightMask);
    gl_FragColor = vec4(activeDashColor * alpha, alpha);
  }
`;

type Rect = { height: number; width: number; x: number; y: number };
function clampRect(r: Rect, vw: number, vh: number): Rect | null {
    const minX = Math.max(r.x, 0);
    const minY = Math.max(r.y, 0);
    const maxX = Math.min(r.x + r.width, vw);
    const maxY = Math.min(r.y + r.height, vh);
    if (maxX <= minX || maxY <= minY) return null;
    return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
}
const rectArea = (r: Rect | null) => (r ? Math.max(r.width, 0) * Math.max(r.height, 0) : 0);
const previewZoom = (d: number) => REFERENCE_PREVIEW_DISTANCE / Math.max(d, 0.001);
function containedRect(iw: number, ih: number, vw: number, vh: number, zoom: number): Rect | null {
    if (iw <= 0 || ih <= 0 || vw <= 0 || vh <= 0) return null;
    const sw = vw * zoom;
    const sh = (vw / (iw / ih)) * zoom;
    return clampRect({ height: sh, width: sw, x: (vw - sw) * 0.5, y: (vh - sh) * 0.5 }, vw, vh);
}
function footprintScale(iw: number, ih: number, vw: number, vh: number, previewDistance: number) {
    const ca = rectArea(containedRect(iw, ih, vw, vh, previewZoom(previewDistance)));
    const ra = rectArea(containedRect(iw, ih, vw, vh, 1));
    if (ca <= 0 || ra <= 0) return 1;
    return Math.max(Math.sqrt(ca / ra), MIN_FOOTPRINT_SCALE);
}

export type HalftoneInstance = {
    update(options: Partial<HalftoneOptions>): void;
    setImage(src: string): void;
    exportPNG(filename?: string): void;
    destroy(): void;
};

/** Mount the Twenty-style halftone onto a container element. */
export function createHalftone(container: HTMLElement, options: HalftoneOptions): HalftoneInstance {
    let opts = { ...DEFAULTS, ...options };

    const getW = () => Math.max(container.clientWidth, 1);
    const getH = () => Math.max(container.clientHeight, 1);
    const getVH = () => Math.max(VIRTUAL_RENDER_HEIGHT, getH());
    const getVW = () => Math.max(Math.round(getVH() * (getW() / Math.max(getH(), 1))), 1);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(getVW(), getVH(), false);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    container.appendChild(canvas);

    const geo = new THREE.PlaneGeometry(2, 2);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const sceneTarget = new THREE.WebGLRenderTarget(getVW(), getVH(), {
        format: THREE.RGBAFormat,
        magFilter: THREE.LinearFilter,
        minFilter: THREE.LinearFilter,
    });

    let tex: THREE.Texture | null = null;
    let imgW = 1;
    let imgH = 1;

    const imageMaterial = new THREE.ShaderMaterial({
        vertexShader: passThroughVertexShader,
        fragmentShader: imagePassthroughFragmentShader,
        uniforms: {
            contrast: { value: opts.contrast },
            horizontalPixelOffset: { value: opts.horizontalOffsetPx },
            imageSize: { value: new THREE.Vector2(1, 1) },
            tImage: { value: null },
            verticalAnchor: { value: opts.verticalAnchor },
            verticalPixelOffset: { value: opts.verticalOffsetPx },
            viewportSize: { value: new THREE.Vector2(getVW(), getVH()) },
            zoom: { value: previewZoom(opts.previewDistance) },
        },
    });
    const imageScene = new THREE.Scene();
    imageScene.add(new THREE.Mesh(geo, imageMaterial));

    const halftoneMaterial = new THREE.ShaderMaterial({
        vertexShader: passThroughVertexShader,
        fragmentShader: halftoneFragmentShader,
        transparent: true,
        uniforms: {
            applyToDarkAreas: { value: opts.invert ? 1 : 0 },
            cropToBounds: { value: opts.cropToBounds ? 1 : 0 },
            dashColor: { value: new THREE.Color(opts.ink) },
            effectResolution: { value: new THREE.Vector2(getVW(), getVH()) },
            footprintScale: { value: 1 },
            hoverDashColor: { value: new THREE.Color(opts.hoverColor) },
            hoverLightRadius: { value: opts.hoverRadius },
            hoverLightStrength: { value: 0 },
            hoverVerticalFade: { value: HOVER_VERTICAL_FADE },
            interactionUv: { value: new THREE.Vector2(0.5, 0.5) },
            logicalResolution: { value: new THREE.Vector2(getVW(), getVH()) },
            s_3: { value: opts.power },
            s_4: { value: opts.width },
            tScene: { value: sceneTarget.texture },
            tile: { value: opts.tile },
        },
    });
    const postScene = new THREE.Scene();
    postScene.add(new THREE.Mesh(geo, halftoneMaterial));

    const syncSize = () => {
        const vw = getVW();
        const vh = getVH();
        renderer.setSize(vw, vh, false);
        sceneTarget.setSize(vw, vh);
        halftoneMaterial.uniforms.effectResolution.value.set(vw, vh);
        halftoneMaterial.uniforms.logicalResolution.value.set(vw, vh);
        imageMaterial.uniforms.viewportSize.value.set(vw, vh);
    };
    const ro = new ResizeObserver(syncSize);
    ro.observe(container);

    const loadImage = (src: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            tex?.dispose();
            tex = new THREE.Texture(img);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.generateMipmaps = false;
            tex.magFilter = THREE.LinearFilter;
            tex.minFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            imgW = img.width;
            imgH = img.height;
            imageMaterial.uniforms.tImage.value = tex;
            imageMaterial.uniforms.imageSize.value.set(imgW, imgH);
        };
        img.src = src;
    };
    loadImage(opts.src);

    // hover state
    const pointer = { mouseX: 0.5, mouseY: 0.5, inside: false, sx: 0.5, sy: 0.5, strength: 0 };
    const onMove = (e: PointerEvent) => {
        const r = container.getBoundingClientRect();
        pointer.mouseX = (e.clientX - r.left) / Math.max(r.width, 1);
        pointer.mouseY = (e.clientY - r.top) / Math.max(r.height, 1);
        pointer.inside = opts.hover;
    };
    const onLeave = () => {
        pointer.inside = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
        const dt = last ? (now - last) / 1000 : 0.016;
        last = now;
        const inside = pointer.inside ? 1 : 0;
        const easing = 1 - Math.exp(-dt * (inside ? HOVER_FADE_IN : HOVER_FADE_OUT));
        pointer.strength += (inside - pointer.strength) * easing;
        pointer.sx += (pointer.mouseX - pointer.sx) * POINTER_FOLLOW;
        pointer.sy += (pointer.mouseY - pointer.sy) * POINTER_FOLLOW;

        halftoneMaterial.uniforms.interactionUv.value.set(pointer.sx, 1 - pointer.sy);
        halftoneMaterial.uniforms.hoverLightStrength.value = opts.hoverIntensity * pointer.strength;
        halftoneMaterial.uniforms.footprintScale.value = footprintScale(
            imgW,
            imgH,
            getVW(),
            getVH(),
            opts.previewDistance,
        );

        renderer.setRenderTarget(sceneTarget);
        renderer.render(imageScene, cam);
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(postScene, cam);
        raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return {
        update(next) {
            opts = { ...opts, ...next };
            const i = imageMaterial.uniforms;
            const h = halftoneMaterial.uniforms;
            i.contrast.value = opts.contrast;
            i.horizontalPixelOffset.value = opts.horizontalOffsetPx;
            i.verticalAnchor.value = opts.verticalAnchor;
            i.verticalPixelOffset.value = opts.verticalOffsetPx;
            i.zoom.value = previewZoom(opts.previewDistance);
            h.applyToDarkAreas.value = opts.invert ? 1 : 0;
            h.cropToBounds.value = opts.cropToBounds ? 1 : 0;
            h.dashColor.value = new THREE.Color(opts.ink);
            h.hoverDashColor.value = new THREE.Color(opts.hoverColor);
            h.hoverLightRadius.value = opts.hoverRadius;
            h.s_3.value = opts.power;
            h.s_4.value = opts.width;
            h.tile.value = opts.tile;
            if (next.src) loadImage(next.src);
        },
        setImage(src) {
            opts.src = src;
            loadImage(src);
        },
        exportPNG(filename = "halftone.png") {
            const url = renderer.domElement.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
        },
        destroy() {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerleave", onLeave);
            window.removeEventListener("blur", onLeave);
            halftoneMaterial.dispose();
            imageMaterial.dispose();
            tex?.dispose();
            geo.dispose();
            sceneTarget.dispose();
            renderer.dispose();
            if (canvas.parentNode === container) container.removeChild(canvas);
        },
    };
}
