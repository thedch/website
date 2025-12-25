import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

type Vec2 = { x: number; y: number };

function clamp(v: number, a = -1, b = 1) {
  return Math.min(b, Math.max(a, v));
}

function damp(current: number, target: number, lambda: number, dt: number) {
  // frame-rate independent smoothing
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/**
 * This component replaces WebGL rendering with ASCII rendering.
 * It still uses the WebGL renderer internally, but draws via AsciiEffect.
 */
function AsciiRenderer({
  fg = "#111",
  bg = "transparent",
  resolution = 0.18, // smaller => denser ASCII; tune per your design
}: {
  fg?: string;
  bg?: string;
  resolution?: number;
}) {
  const { gl, scene, camera, size } = useThree();
  const effect = useMemo(() => {
    // Char ramp: from light to dark. You can tweak this for your vibe.
    const chars = " .:-=+*#%@";
    const e = new AsciiEffect(gl, chars, { invert: false });

    // Style the ASCII output
    e.domElement.style.color = fg;
    e.domElement.style.backgroundColor = bg;
    e.domElement.style.whiteSpace = "pre";
    e.domElement.style.fontFamily =
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    e.domElement.style.fontWeight = "600";
    e.domElement.style.lineHeight = "1";
    e.domElement.style.letterSpacing = "0.02em";
    e.domElement.style.userSelect = "none";
    e.domElement.style.pointerEvents = "none"; // let wrapper capture pointer

    return e;
  }, [gl, fg, bg]);

  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;

    // Hide raw WebGL canvas; show ASCII DOM instead
    gl.domElement.style.display = "none";
    parent.appendChild(effect.domElement);

    return () => {
      gl.domElement.style.display = "";
      if (effect.domElement.parentElement === parent) {
        parent.removeChild(effect.domElement);
      }
    };
  }, [gl, effect]);

  useEffect(() => {
    // AsciiEffect needs explicit sizing; also tune font size based on canvas size
    effect.setSize(size.width, size.height);

    // Rough heuristic: bigger canvas => bigger font; resolution scales density
    const fontPx = Math.max(
      8,
      Math.floor(Math.min(size.width, size.height) * resolution),
    );
    effect.domElement.style.fontSize = `${fontPx}px`;
  }, [effect, size, resolution]);

  // Render ASCII each frame
  useFrame(() => {
    effect.render(scene, camera);
  }, 1); // render after scene updates

  return null;
}

function HeadBlob({
  pointer,
  reducedMotion,
}: {
  pointer: React.MutableRefObject<Vec2>;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const keyLightRef = useRef<THREE.DirectionalLight>(null!);
  const fillLightRef = useRef<THREE.DirectionalLight>(null!);

  // smoothed pointer so it feels “alive”
  const smooth = useRef<Vec2>({ x: 0, y: 0 });

  const noise = new SimplexNoise();
  const basePositions = useRef<Float32Array>();

  useEffect(() => {
    const geo = meshRef.current.geometry as THREE.BufferGeometry;
    basePositions.current =
      geo.attributes.position.array.slice() as Float32Array;
  }, []);

  useFrame(({ clock }) => {
    const geo = meshRef.current.geometry as THREE.BufferGeometry;
    const pos = geo.attributes.position;
    const t = clock.elapsedTime;

    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const x = basePositions.current![ix];
      const y = basePositions.current![ix + 1];
      const z = basePositions.current![ix + 2];

      const n = noise.noise3d(x * 0.8, y * 0.8, z * 0.8 + t * 0.6) * 0.03;

      pos.array[ix] = x + x * n;
      pos.array[ix + 1] = y + y * n;
      pos.array[ix + 2] = z + z * n;
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    // Smooth cursor
    smooth.current.x = damp(smooth.current.x, pointer.current.x, 10, dt);
    smooth.current.y = damp(smooth.current.y, pointer.current.y, 10, dt);

    const mx = smooth.current.x;
    const my = smooth.current.y;

    // Idle motion
    const breath = reducedMotion ? 1 : 1 + 0.04 * Math.sin(t * 0.9);
    const floatY = reducedMotion ? 0 : 0.15 * Math.sin(t * 0.65);
    const roll = reducedMotion ? 0 : 0.08 * Math.sin(t * 0.5);

    // Cursor adds “attention”
    const yaw = mx * 0.6;
    const pitch = -my * 0.35;

    meshRef.current.position.y = floatY;
    meshRef.current.rotation.y =
      yaw + (reducedMotion ? 0 : 0.25 * Math.sin(t * 0.25));
    meshRef.current.rotation.x =
      pitch + (reducedMotion ? 0 : 0.08 * Math.sin(t * 0.35));
    meshRef.current.rotation.z = roll;
    meshRef.current.scale.setScalar(breath);

    // Lighting steers with cursor to create shifting ASCII shading
    keyLightRef.current.position.set(2.5 + mx * 2.0, 2.0 + my * 1.5, 3.5);
    fillLightRef.current.position.set(-2.5 - mx * 1.0, -1.0 - my * 0.8, 3.0);
  });

  return (
    <>
      <directionalLight ref={keyLightRef} intensity={2.6} color={"#ffffff"} />
      <directionalLight ref={fillLightRef} intensity={0.8} color={"#bcd3ff"} />
      <ambientLight intensity={0.2} />

      {/* Start with a blob; it reads like a “head” once ASCII’d */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.25, 6]} />
        <meshStandardMaterial
          color={"#ffffff"}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* Optional “shoulders” silhouette to make it feel more head-like */}
      <mesh position={[0, -1.55, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[1.4, 1.2, 0.9, 32]} />
        <meshStandardMaterial
          color={"#ffffff"}
          roughness={0.45}
          metalness={0.02}
        />
      </mesh>
    </>
  );
}

export default function AsciiHero({
  className,
  fg = "#1a1a1a",
  bg = "transparent",
}: {
  className?: string;
  fg?: string;
  bg?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<Vec2>({ x: 0, y: 0 });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointer.current = { x: clamp(x), y: clamp(y) };
    };

    const onLeave = () => {
      pointer.current = { x: 0, y: 0 };
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "420px",
        overflow: "hidden",
        borderRadius: "24px",
      }}
      aria-label="ASCII hero animation"
      role="img"
    >
      <Canvas
        // keep DPR low for crisp ASCII + less work
        dpr={1}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.35, 3.4], fov: 42, near: 0.1, far: 100 }}
      >
        {/* Scene background stays transparent; you control bg via CSS or AsciiRenderer */}
        <HeadBlob pointer={pointer} reducedMotion={reducedMotion} />
        <AsciiRenderer fg={fg} bg={bg} resolution={0.16} />
      </Canvas>

      {/* Optional: a subtle fade to integrate with page */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.06) 80%, rgba(0,0,0,0.10) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
