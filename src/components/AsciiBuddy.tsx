import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AsciiBuddy.css";

const clamp = (value: number, min = -1, max = 1) =>
  Math.min(max, Math.max(min, value));

const eyeChar = (dx: number, dy: number) => {
  const horizontal = dx > 0.35 ? ">" : dx < -0.35 ? "<" : "o";

  if (dy > 0.45) return "u";
  if (dy < -0.45) return "^";
  return horizontal;
};

const AsciiBuddy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [hoverTilt, setHoverTilt] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [isPointerOver, setIsPointerOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const leftEye = useMemo(
    () => eyeChar(clamp(eyeOffset.x - 0.15), eyeOffset.y),
    [eyeOffset]
  );
  const rightEye = useMemo(
    () => eyeChar(clamp(eyeOffset.x + 0.15), eyeOffset.y),
    [eyeOffset]
  );

  const isInteracting = dragging || isPointerOver || isFocused;
  const dragTilt = dragOffset.x / 5;
  const combinedTilt = clamp(hoverTilt + dragTilt, -14, 14);
  const swayPausedClass = isInteracting ? "paused" : "";

  const resetEyes = () => {
    setEyeOffset({ x: 0, y: 0 });
    setHoverTilt(0);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = clamp((event.clientX - rect.left) / rect.width * 2 - 1);
    const y = clamp((event.clientY - rect.top) / rect.height * 2 - 1);

    setEyeOffset({ x, y });

    if (dragging && dragStartRef.current) {
      setDragOffset({
        x: clamp(event.clientX - dragStartRef.current.x, -18, 18),
        y: clamp(event.clientY - dragStartRef.current.y, -18, 18),
      });
    }

    if (!dragging) {
      setHoverTilt(x * 10);
    }
  };

  const endDrag = () => {
    setDragging(false);
    setDragOffset({ x: 0, y: 0 });
    dragStartRef.current = null;
  };

  useEffect(() => {
    const handlePointerUp = () => {
      if (dragging) {
        endDrag();
      }
    };

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      x: event.clientX - dragOffset.x,
      y: event.clientY - dragOffset.y,
    };
  };

  const handlePointerLeave = () => {
    setIsPointerOver(false);
    if (!dragging) {
      resetEyes();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      setIsFocused(true);
      const step = 0.35;
      if (event.key === "ArrowLeft") {
        setEyeOffset((prev) => ({ ...prev, x: clamp(prev.x - step) }));
        setHoverTilt(-10);
      }
      if (event.key === "ArrowRight") {
        setEyeOffset((prev) => ({ ...prev, x: clamp(prev.x + step) }));
        setHoverTilt(10);
      }
      if (event.key === "ArrowUp") {
        setEyeOffset((prev) => ({ ...prev, y: clamp(prev.y - step) }));
      }
      if (event.key === "ArrowDown") {
        setEyeOffset((prev) => ({ ...prev, y: clamp(prev.y + step) }));
      }
    }

    if (event.key === "Escape") {
      resetEyes();
      setIsFocused(false);
    }
  };

  const handleKeyUp = () => {
    if (!dragging) {
      setHoverTilt(0);
    }
  };

  const ascii = useMemo(
    () =>
      [
        "   .-\"\"\"-.   ",
        "  /        \\",
        ` |   ${leftEye}  ${rightEye}   |`,
        " |    ---    |",
        "  \\  ♥♥  //",
        "   '-.___.'   ",
      ].join("\n"),
    [leftEye, rightEye]
  );

  return (
    <div
      className={`ascii-buddy-wrapper ${swayPausedClass} rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-colors duration-300 dark:border-white/10 dark:bg-neutral-900/70`}
      ref={containerRef}
      onPointerEnter={() => setIsPointerOver(true)}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        resetEyes();
      }}
      tabIndex={0}
      role="img"
      aria-label="Friendly ASCII buddy that reacts to movement"
    >
      <pre
        className="ascii-buddy font-mono text-sm leading-5 text-black transition-transform duration-200 ease-out dark:text-white"
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${combinedTilt}deg)`,
        }}
      >
        {ascii}
      </pre>
      <p className="sr-only">
        Use your mouse, touch, or arrow keys to move the buddy's gaze and tilt.
      </p>
    </div>
  );
};

export default AsciiBuddy;
