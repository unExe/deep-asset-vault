import { useEffect, useState } from "react";

/** Soft radial glow that follows the cursor. Desktop pointers only. */
export function CursorGlow() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setPos({ x: e.clientX, y: e.clientY });
      });
    };
    const onLeave = () => setPos(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] transition-opacity duration-500"
      style={{
        opacity: pos ? 1 : 0,
        background: pos
          ? `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, color-mix(in oklab, var(--color-vault-fg) 10%, transparent), transparent 70%)`
          : undefined,
      }}
    />
  );
}
