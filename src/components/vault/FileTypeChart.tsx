import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "@phosphor-icons/react";

interface Bucket {
  label: string;
  count: number;
  color: string;
}

const PALETTE = [
  "oklch(0.65 0.2 250)", // blue
  "oklch(0.65 0.22 25)", // red
  "oklch(0.7 0.18 145)", // green
  "oklch(0.7 0.18 80)",  // amber
  "oklch(0.65 0.2 320)", // magenta
  "oklch(0.6 0 0)",      // grey
];

function categorize(type: string | null): string {
  if (!type) return "Other";
  if (type.startsWith("image/")) return "Photo";
  if (type.startsWith("video/")) return "Video";
  if (type.startsWith("audio/")) return "Audio";
  if (
    type.startsWith("text/") ||
    type === "application/pdf" ||
    type.includes("document") ||
    type.includes("spreadsheet") ||
    type.includes("presentation")
  )
    return "Document";
  return "Other";
}

export function FileTypeChart() {
  const [allBuckets, setAllBuckets] = useState<Bucket[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("assets").select("file_type");
      const counts = new Map<string, number>();
      for (const row of (data as { file_type: string | null }[] | null) ?? []) {
        const k = categorize(row.file_type);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      const sorted = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, count], i) => ({ label, count, color: PALETTE[i % PALETTE.length] }));
      setAllBuckets(sorted);
    })();
  }, []);

  // Build top-3 + Others
  const top3 = allBuckets.slice(0, 3);
  const rest = allBuckets.slice(3);
  const restCount = rest.reduce((s, b) => s + b.count, 0);
  const display: Bucket[] = [...top3];
  if (restCount > 0) display.push({ label: "Others", count: restCount, color: "oklch(0.55 0 0)" });

  if (display.length === 0) {
    return <div className="text-[11px] text-vault-fg-muted px-3 py-2">No files yet</div>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left px-3 py-2 rounded-md hover:bg-vault-overlay transition-colors"
        aria-label="File type breakdown"
      >
        <div className="text-[10px] uppercase tracking-wider text-vault-fg-muted mb-2">Library</div>
        <ul className="space-y-1.5">
          {display.map((b) => (
            <li key={b.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: b.color }}
                />
                <span className="text-vault-fg truncate">{b.label}</span>
              </div>
              <span className="text-vault-fg-muted tabular-nums">{b.count}</span>
            </li>
          ))}
        </ul>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-vault-menu-bg border border-vault-hairline shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-vault-hairline">
              <div className="text-sm text-vault-fg font-medium">Library breakdown</div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted"
              >
                <X size={14} />
              </button>
            </div>
            <ul className="px-4 py-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {allBuckets.map((b) => {
                const total = allBuckets.reduce((s, x) => s + x.count, 0);
                const pct = total ? (b.count / total) * 100 : 0;
                return (
                  <li key={b.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                        <span className="text-vault-fg">{b.label}</span>
                      </div>
                      <span className="text-vault-fg-muted tabular-nums">
                        {b.count} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-vault-overlay overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
