"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const SURFACE_POINTS = 14000;
const HALO_POINTS = 1200;
const RADIUS = 1;
const TILT_X = 0.18;
const EQUATOR_THINNING = 0.5;
const EQUATOR_DIMMING = 0.7;
const SPIN_SPEED = 0.08;

const vertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (3.2 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = aAlpha;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;
    float soft = smoothstep(0.5, 0.15, dist);
    gl_FragColor = vec4(vec3(1.0), vAlpha * soft);
  }
`;

function buildGeometry() {
    const total = SURFACE_POINTS + HALO_POINTS;
    const positions = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const alphas = new Float32Array(total);

    for (let i = 0; i < total; i++) {
        const isHalo = i >= SURFACE_POINTS;
        const hemisphere = Math.random() < 0.5 ? -1 : 1;
        const height = hemisphere * Math.pow(Math.random(), EQUATOR_THINNING);
        const ring = Math.sqrt(1 - height * height);
        const phi = Math.random() * Math.PI * 2;
        const radius = isHalo
            ? RADIUS * (1 + Math.random() * 0.18)
            : RADIUS * (0.985 + Math.random() * 0.03);

        positions[i * 3] = radius * ring * Math.cos(phi);
        positions[i * 3 + 1] = radius * height;
        positions[i * 3 + 2] = radius * ring * Math.sin(phi);

        const nearPole = Math.abs(height);
        const equatorFade = 1 - EQUATOR_DIMMING * (1 - nearPole);
        sizes[i] = 1 + Math.pow(Math.random(), 3) * 4.5;
        alphas[i] =
            (isHalo ? 0.15 + Math.random() * 0.3 : 0.35 + Math.random() * 0.65) * equatorFade;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return geometry;
}

export default function ParticleSphere() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.z = 5.4;

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: { uPixelRatio: { value: 1 } },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const points = new THREE.Points(buildGeometry(), material);
        points.rotation.x = TILT_X;
        scene.add(points);

        const fit = () => {
            const { clientWidth, clientHeight } = container;
            const pixelRatio = Math.min(window.devicePixelRatio, 2);
            renderer.setPixelRatio(pixelRatio);
            renderer.setSize(clientWidth, clientHeight);
            material.uniforms.uPixelRatio.value = pixelRatio;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
        };

        const resizeObserver = new ResizeObserver(fit);
        resizeObserver.observe(container);
        fit();

        const clock = new THREE.Clock();
        let frameId = 0;
        const render = () => {
            points.rotation.y = clock.getElapsedTime() * SPIN_SPEED;
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            points.geometry.dispose();
            material.dispose();
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0" />;
}
