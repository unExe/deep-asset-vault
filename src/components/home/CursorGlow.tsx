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
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden transition-opacity duration-500"
      style={{ opacity: pos ? 1 : 0 }}
    >
      <div
        className="pointer-events-none absolute h-[840px] w-[840px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform: pos
            ? `translate(${pos.x}px, ${pos.y}px)`
            : "translate(-50%, -50%)",
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--color-vault-fg) 10%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}
