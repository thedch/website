import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";
import "./AsciiBuddy.css";

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

function FloatingOrb({
  index,
  initialPosition,
  reducedMotion,
}: {
  index: number;
  initialPosition?: THREE.Vector3;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const velocity = useRef<THREE.Vector3>(
    new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
    ),
  );
  const position = useRef<THREE.Vector3>(
    initialPosition ||
      new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ),
  );

  // Random size for variety - wider range with some really big orbs
  const size = useMemo(() => {
    // Use a distribution that favors smaller sizes but allows for really big ones
    const rand = Math.random();
    if (rand < 0.7) {
      // 70% chance: small to medium (0.1 to 0.3)
      return 0.1 + Math.random() * 0.2;
    } else if (rand < 0.9) {
      // 20% chance: medium to large (0.3 to 0.6)
      return 0.3 + Math.random() * 0.3;
    } else {
      // 10% chance: really big (0.6 to 1.0)
      return 0.6 + Math.random() * 0.4;
    }
  }, []);

  useFrame((state, dt) => {
    if (!meshRef.current) return;

    const t = state.clock.elapsedTime;

    // Add some floating motion
    if (!reducedMotion) {
      velocity.current.y += Math.sin(t * 0.5 + index) * 0.0001;
      velocity.current.x += Math.cos(t * 0.3 + index) * 0.0001;
      velocity.current.z += Math.sin(t * 0.4 + index * 0.5) * 0.0001;
    }

    // Apply velocity with damping
    velocity.current.multiplyScalar(0.98);
    position.current.add(velocity.current);

    // Boundary constraints (soft walls)
    const bounds = 2.5;
    if (Math.abs(position.current.x) > bounds) {
      velocity.current.x *= -0.5;
      position.current.x = Math.sign(position.current.x) * bounds;
    }
    if (Math.abs(position.current.y) > bounds) {
      velocity.current.y *= -0.5;
      position.current.y = Math.sign(position.current.y) * bounds;
    }
    if (Math.abs(position.current.z) > bounds) {
      velocity.current.z *= -0.5;
      position.current.z = Math.sign(position.current.z) * bounds;
    }

    // Update mesh position
    meshRef.current.position.copy(position.current);

    // Subtle rotation
    if (!reducedMotion) {
      meshRef.current.rotation.x += dt * 0.5;
      meshRef.current.rotation.y += dt * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={"#ffffff"}
        roughness={0.35}
        metalness={0.05}
      />
    </mesh>
  );
}

type OrbData = {
  id: number;
  initialPosition?: THREE.Vector3;
};

function FloatingOrbs({
  pointer,
  createOrbAt,
  reducedMotion,
}: {
  pointer: React.MutableRefObject<Vec2>;
  createOrbAt: React.MutableRefObject<
    ((normalizedX: number, normalizedY: number) => void) | null
  >;
  reducedMotion: boolean;
}) {
  const keyLightRef = useRef<THREE.DirectionalLight>(null!);
  const fillLightRef = useRef<THREE.DirectionalLight>(null!);

  // Initial random number of orbs between 3-6
  const [orbs, setOrbs] = useState<OrbData[]>(() => {
    const count = 3 + Math.floor(Math.random() * 4);
    return Array.from({ length: count }, (_, i) => ({ id: i }));
  });

  const smooth = useRef<Vec2>({ x: 0, y: 0 });
  const nextOrbId = useRef(100); // Start high to avoid conflicts with initial orbs

  // Expose function to create new orb at click position
  useEffect(() => {
    const handleClick = (normalizedX: number, normalizedY: number) => {
      // Simple 2D plane mapping - map normalized coordinates directly to world space
      // The scene is viewed from z=3.4, so we place orbs on a plane at z=0
      const worldPos = new THREE.Vector3(
        normalizedX * 2.5, // Scale to match scene bounds
        -normalizedY * 2.5, // Invert Y and scale
        0, // Place on the z=0 plane
      );

      setOrbs((prev) => {
        const maxOrbs = 15;
        const newOrbs = [
          ...prev,
          { id: nextOrbId.current++, initialPosition: worldPos },
        ];
        // Remove oldest orb if we exceed the limit
        return newOrbs.length > maxOrbs ? newOrbs.slice(1) : newOrbs;
      });
    };

    createOrbAt.current = handleClick;
  }, [createOrbAt]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    // Smooth cursor
    smooth.current.x = damp(smooth.current.x, pointer.current.x, 10, dt);
    smooth.current.y = damp(smooth.current.y, pointer.current.y, 10, dt);

    const mx = smooth.current.x;
    const my = smooth.current.y;

    // Lighting steers dramatically with cursor to create shifting ASCII shading
    keyLightRef.current.position.set(
      2.5 + mx * 6.0,
      2.0 + my * 5.0,
      3.5 + mx * 2.0,
    );
    fillLightRef.current.position.set(
      -2.5 - mx * 4.0,
      -1.0 - my * 3.5,
      3.0 - mx * 1.5,
    );
  });

  return (
    <>
      <directionalLight ref={keyLightRef} intensity={2.6} color={"#ffffff"} />
      <directionalLight ref={fillLightRef} intensity={0.8} color={"#bcd3ff"} />
      <ambientLight intensity={0.2} />

      {orbs.map((orb, i) => (
        <FloatingOrb
          key={orb.id}
          index={i}
          initialPosition={orb.initialPosition}
          reducedMotion={reducedMotion}
        />
      ))}
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
  const createOrbAt = useRef<
    ((normalizedX: number, normalizedY: number) => void) | null
  >(null);
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

    const onClick = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      const normalizedX = clamp(x);
      const normalizedY = clamp(y);

      // Create new orb at click position
      if (createOrbAt.current) {
        createOrbAt.current(normalizedX, normalizedY);
      }
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("click", onClick);
    // Also handle touch events for mobile
    el.addEventListener("touchend", (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const r = el.getBoundingClientRect();
      const x = ((touch.clientX - r.left) / r.width) * 2 - 1;
      const y = ((touch.clientY - r.top) / r.height) * 2 - 1;
      const normalizedX = clamp(x);
      const normalizedY = clamp(y);

      if (createOrbAt.current) {
        createOrbAt.current(normalizedX, normalizedY);
      }
    });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className={className}>
      <div
        ref={wrapperRef}
        className="asciiWrapper"
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
          <FloatingOrbs
            pointer={pointer}
            createOrbAt={createOrbAt}
            reducedMotion={reducedMotion}
          />
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

      {/* Caption */}
      <div className="asciiCaption">click to add more orbs :)</div>
    </div>
  );
}
