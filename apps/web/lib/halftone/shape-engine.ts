// 3D variant of the Twenty halftone: instead of a flat image, the first pass
// renders a lit, slowly-spinning *extruded SVG* into a render target; the second
// pass is the exact same line-screen shader as `hero-engine.ts`. The shape spins
// on its own and is drag-to-rotate (grab cursor), like Twenty's testimonial icons.
//
//   import { createHalftoneShape } from "@/lib/halftone/shape-engine";
//   const h = createHalftoneShape(containerEl, { src: "/icon.svg" });
//   h.update({ tile: 10, ink: "#4a38f5" });
//   h.destroy();
//
// Only dependency: three (+ its bundled SVGLoader example).

import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

const VIRTUAL_RENDER_HEIGHT = 768;

export type HalftoneShapeOptions = {
    /** SVG to extrude and spin (URL / public path). */
    src: string;
    ink?: string; // line color (Twenty: #4A38F5)
    hoverColor?: string; // line color under the cursor
    tile?: number; // cell size px (smaller = denser)
    power?: number; // s_3 tone bias
    width?: number; // s_4 line thickness
    invert?: boolean; // dark areas become lines
    extrudeDepth?: number; // extrusion as a fraction of the shape's size (0 = flat)
    autoSpin?: number; // idle spin speed, radians/sec (0 = none)
    tiltX?: number; // resting tilt on the X axis (radians)
    hover?: boolean; // cursor hover light
    hoverRadius?: number;
    hoverIntensity?: number;
};

const DEFAULTS: Required<Omit<HalftoneShapeOptions, "src">> = {
    ink: "#4A38F5",
    hoverColor: "#4A38F5",
    tile: 10,
    power: -0.07,
    width: 0.34,
    invert: true,
    extrudeDepth: 0.22,
    autoSpin: 0.5,
    tiltX: 0.12,
    hover: true,
    hoverRadius: 0.18,
    hoverIntensity: 0.8,
};

const HOVER_FADE_IN = 18;
const HOVER_FADE_OUT = 7;
const HOVER_VERTICAL_FADE = 0.5;
const DRAG_SENSITIVITY = 0.01;
const INERTIA_DECAY = 6; // higher = inertia dies faster
const ROT_X_LIMIT = 1.1;
const FIT = 2.2; // target world height the shape is scaled to

const passThroughVertexShader = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;

// Identical line-screen as hero-engine.ts (footprintScale pinned to 1 — the 3D
// pass already fills the frame, so there is no image-fit term).
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
  uniform vec2 interactionUv;
  uniform float hoverLightStrength;
  uniform float hoverLightRadius;
  uniform float hoverVerticalFade;
  varying vec2 vUv;

  float distSegment(in vec2 p, in vec2 a, in vec2 b) {
    vec2 pa = p - a; vec2 ba = b - a;
    float denom = max(dot(ba, ba), 0.000001);
    float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
    return length(pa - ba * h);
  }
  float lineSimpleEt(in vec2 p, in float r, in float thickness) {
    vec2 a = vec2(0.5) + vec2(-r, 0.0);
    vec2 b = vec2(0.5) + vec2(r, 0.0);
    return distSegment(p, a, b) - thickness * r;
  }

  void main() {
    vec2 fragCoord = (gl_FragCoord.xy / max(effectResolution, vec2(1.0))) * logicalResolution;
    float halftoneSize = max(tile, 1.0);
    vec2 pointerPx = interactionUv * logicalResolution;
    float fragDist = length(fragCoord - pointerPx);

    float hoverLightMask = 0.0;
    if (hoverLightStrength > 0.0) {
      float lightRadiusPx = hoverLightRadius * logicalResolution.y;
      hoverLightMask = smoothstep(lightRadiusPx, 0.0, fragDist);
      float fadeRange = max(hoverVerticalFade, 0.0001);
      hoverLightMask *= smoothstep(0.0, fadeRange, vUv.y) * smoothstep(0.0, fadeRange, 1.0 - vUv.y);
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

export type HalftoneShapeInstance = {
    update(options: Partial<HalftoneShapeOptions>): void;
    setSrc(src: string): void;
    destroy(): void;
};

/** Mount a spinning, drag-rotatable, extruded-SVG halftone onto a container. */
export function createHalftoneShape(
    container: HTMLElement,
    options: HalftoneShapeOptions,
): HalftoneShapeInstance {
    let opts = { ...DEFAULTS, ...options };

    const getW = () => Math.max(container.clientWidth, 1);
    const getH = () => Math.max(container.clientHeight, 1);
    const getVH = () => Math.max(VIRTUAL_RENDER_HEIGHT, getH());
    const getVW = () => Math.max(Math.round(getVH() * (getW() / Math.max(getH(), 1))), 1);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(getVW(), getVH(), false);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    container.appendChild(canvas);

    // --- 3D scene (first pass) ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, getVW() / getVH(), 0.1, 100);
    camera.position.set(0, 0, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-1.4, 1.8, 1.2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.9);
    fill.position.set(1.5, -1.0, 0.8);
    scene.add(fill);

    const spinner = new THREE.Group();
    scene.add(spinner);
    let content: THREE.Group | null = null;

    const FRAME_MARGIN = 1.08; // ~8% padding around the shape's bounding sphere
    const frameCamera = (radius: number) => {
        const dist = (radius * FRAME_MARGIN) / Math.sin((camera.fov * Math.PI) / 360);
        camera.position.z = dist;
        camera.near = Math.max(dist - radius * 2, 0.1);
        camera.far = dist + radius * 2;
        camera.updateProjectionMatrix();
    };

    const buildShape = (src: string) => {
        new SVGLoader().load(src, (data) => {
            if (disposed) return;
            const next = new THREE.Group();
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.55,
                metalness: 0.0,
                side: THREE.DoubleSide,
            });

            for (const path of data.paths) {
                const shapes = SVGLoader.createShapes(path);
                for (const shape of shapes) {
                    const depth = 1; // scaled later via the whole group
                    const geo = new THREE.ExtrudeGeometry(shape, {
                        depth,
                        bevelEnabled: true,
                        bevelThickness: 0.6,
                        bevelSize: 0.6,
                        bevelSegments: 2,
                        steps: 1,
                    });
                    next.add(new THREE.Mesh(geo, material));
                }
            }

            // SVGs are Y-down and authored at ~800px; center, flip Y, normalise.
            const box = new THREE.Box3().setFromObject(next);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const planeMax = Math.max(size.x, size.y, 1);
            next.children.forEach((m) => m.position.sub(center));

            // Scale into view: fit X/Y by the shape's largest planar dimension,
            // flip Y (SVG is Y-down), and set Z so final thickness = FIT*extrudeDepth
            // (the source extrusion is 1 unit, so scale.z IS the final thickness).
            const s = FIT / planeMax;
            const wrap = new THREE.Group();
            wrap.add(next);
            wrap.scale.set(s, -s, Math.max(FIT * opts.extrudeDepth, 0.001));

            if (content) {
                spinner.remove(content);
                disposeGroup(content);
            }
            content = wrap;
            spinner.add(content);
            // Frame to the shape's true bounding sphere (rotation-invariant, so
            // it never clips while spinning) instead of a guessed radius.
            const sphere = new THREE.Box3()
                .setFromObject(wrap)
                .getBoundingSphere(new THREE.Sphere());
            frameCamera(sphere.radius);
        });
    };
    buildShape(opts.src);

    // --- halftone (second pass) ---
    const sceneTarget = new THREE.WebGLRenderTarget(getVW(), getVH(), {
        format: THREE.RGBAFormat,
        magFilter: THREE.LinearFilter,
        minFilter: THREE.LinearFilter,
    });
    const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postScene = new THREE.Scene();
    const halftoneMaterial = new THREE.ShaderMaterial({
        vertexShader: passThroughVertexShader,
        fragmentShader: halftoneFragmentShader,
        transparent: true,
        uniforms: {
            applyToDarkAreas: { value: opts.invert ? 1 : 0 },
            dashColor: { value: new THREE.Color(opts.ink) },
            effectResolution: { value: new THREE.Vector2(getVW(), getVH()) },
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
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), halftoneMaterial));

    const syncSize = () => {
        const vw = getVW();
        const vh = getVH();
        renderer.setSize(vw, vh, false);
        sceneTarget.setSize(vw, vh);
        camera.aspect = vw / vh;
        camera.updateProjectionMatrix();
        halftoneMaterial.uniforms.effectResolution.value.set(vw, vh);
        halftoneMaterial.uniforms.logicalResolution.value.set(vw, vh);
    };
    const ro = new ResizeObserver(syncSize);
    ro.observe(container);

    // --- interaction: drag-to-rotate + idle spin + inertia, plus hover light ---
    let rotX = opts.tiltX;
    let rotY = 0;
    let velX = 0;
    let velY = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const pointer = { mx: 0.5, my: 0.5, inside: false, sx: 0.5, sy: 0.5, strength: 0 };

    const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        velX = velY = 0;
        canvas.style.cursor = "grabbing";
        canvas.setPointerCapture(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        canvas.style.cursor = "grab";
        try {
            canvas.releasePointerCapture(e.pointerId);
        } catch {
            /* pointer already released */
        }
    };
    const onMove = (e: PointerEvent) => {
        const r = container.getBoundingClientRect();
        pointer.mx = (e.clientX - r.left) / Math.max(r.width, 1);
        pointer.my = (e.clientY - r.top) / Math.max(r.height, 1);
        pointer.inside = opts.hover;
        if (dragging) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            velY = dx * DRAG_SENSITIVITY;
            velX = dy * DRAG_SENSITIVITY;
            rotY += velY;
            rotX = THREE.MathUtils.clamp(rotX + velX, -ROT_X_LIMIT, ROT_X_LIMIT);
        }
    };
    const onLeave = () => {
        pointer.inside = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let last = 0;
    let disposed = false;
    const loop = (now: number) => {
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
        last = now;

        if (!dragging) {
            rotY += opts.autoSpin * dt + velY;
            rotX = THREE.MathUtils.clamp(rotX + velX, -ROT_X_LIMIT, ROT_X_LIMIT);
            const decay = Math.exp(-INERTIA_DECAY * dt);
            velX *= decay;
            velY *= decay;
            rotX += (opts.tiltX - rotX) * (1 - decay) * 0.15; // gentle settle toward tilt
        }
        spinner.rotation.set(rotX, rotY, 0);

        // hover light easing
        const inside = pointer.inside ? 1 : 0;
        const easing = 1 - Math.exp(-dt * (inside ? HOVER_FADE_IN : HOVER_FADE_OUT));
        pointer.strength += (inside - pointer.strength) * easing;
        pointer.sx += (pointer.mx - pointer.sx) * 0.38;
        pointer.sy += (pointer.my - pointer.sy) * 0.38;
        halftoneMaterial.uniforms.interactionUv.value.set(pointer.sx, 1 - pointer.sy);
        halftoneMaterial.uniforms.hoverLightStrength.value = opts.hoverIntensity * pointer.strength;

        renderer.setRenderTarget(sceneTarget);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(postScene, postCam);
        raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return {
        update(next) {
            opts = { ...opts, ...next };
            const u = halftoneMaterial.uniforms;
            u.applyToDarkAreas.value = opts.invert ? 1 : 0;
            u.dashColor.value = new THREE.Color(opts.ink);
            u.hoverDashColor.value = new THREE.Color(opts.hoverColor);
            u.hoverLightRadius.value = opts.hoverRadius;
            u.s_3.value = opts.power;
            u.s_4.value = opts.width;
            u.tile.value = opts.tile;
            if (next.src) buildShape(next.src);
        },
        setSrc(src) {
            opts.src = src;
            buildShape(src);
        },
        destroy() {
            disposed = true;
            cancelAnimationFrame(raf);
            ro.disconnect();
            canvas.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointermove", onMove);
            container.removeEventListener("pointerleave", onLeave);
            if (content) disposeGroup(content);
            halftoneMaterial.dispose();
            sceneTarget.dispose();
            renderer.dispose();
            if (canvas.parentNode === container) container.removeChild(canvas);
        },
    };
}

function disposeGroup(group: THREE.Object3D) {
    group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
    });
}
