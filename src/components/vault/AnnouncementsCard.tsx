import { useState } from "react";
import { CaretLeft, CaretRight, Megaphone } from "@phosphor-icons/react";
import type { Announcement } from "@/lib/announcements";

interface Props {
  items: Announcement[];
  onOpenAll?: () => void;
}

/** Swipeable announcement card shown inside the expanded sidebar. */
export function AnnouncementsCard({ items, onOpenAll }: Props) {
  const [idx, setIdx] = useState(0);
  const [dragX, setDragX] = useState<number | null>(null);
  const startX = useState<{ v: number | null }>({ v: null })[0];

  if (items.length === 0) return null;
  const safeIdx = Math.min(idx, items.length - 1);
  const a = items[safeIdx];

  const go = (delta: number) => {
    setIdx((i) => (i + delta + items.length) % items.length);
  };

  return (
    <div className="px-2">
      <div className="px-2 mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-vault-fg-muted">
        <Megaphone size={12} weight="duotone" />
        Announcements
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-vault-hairline bg-vault-overlay select-none"
        onPointerDown={(e) => {
          startX.v = e.clientX;
          setDragX(0);
        }}
        onPointerMove={(e) => {
          if (startX.v === null) return;
          setDragX(e.clientX - startX.v);
        }}
        onPointerUp={() => {
          if (dragX !== null && Math.abs(dragX) > 40) go(dragX < 0 ? 1 : -1);
          startX.v = null;
          setDragX(null);
        }}
        onPointerLeave={() => {
          startX.v = null;
          setDragX(null);
        }}
      >
        <button
          onClick={onOpenAll}
          className="block w-full text-left transition-transform duration-200"
          style={{ transform: `translateX(${(dragX ?? 0) * 0.35}px)` }}
        >
          {a.banner_url && (
            <img
              src={a.banner_url}
              alt=""
              loading="lazy"
              className="w-full h-20 object-cover"
            />
          )}
          <div className="p-3">
            <p className="text-xs font-medium text-vault-fg line-clamp-2">{a.title}</p>
            {a.description && (
              <p className="mt-1 text-[11px] leading-relaxed text-vault-fg-muted line-clamp-3">
                {a.description}
              </p>
            )}
            <p className="mt-1.5 text-[10px] text-vault-fg-muted">
              {new Date(a.created_at).toLocaleDateString()}
            </p>
          </div>
        </button>

        {items.length > 1 && (
          <div className="flex items-center justify-between px-2 pb-2">
            <button
              onClick={() => go(-1)}
              aria-label="Previous announcement"
              className="p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted"
            >
              <CaretLeft size={12} />
            </button>
            <div className="flex gap-1">
              {items.slice(0, 8).map((it, i) => (
                <span
                  key={it.id}
                  className={`h-1 rounded-full transition-all ${
                    i === safeIdx ? "w-3 bg-vault-fg" : "w-1 bg-vault-fg/30"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              aria-label="Next announcement"
              className="p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted"
            >
              <CaretRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
