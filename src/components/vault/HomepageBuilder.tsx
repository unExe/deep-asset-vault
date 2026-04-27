import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BLOCK_LABELS,
  DEFAULTS,
  type BlockRow,
  type BlockType,
  loadBlocks,
} from "@/lib/homepage-blocks";
import { X, Plus, ArrowUp, ArrowDown, Trash, FloppyDisk } from "@phosphor-icons/react";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

export function HomepageBuilder({ onClose }: Props) {
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadBlocks().then(setBlocks);
  }, []);

  const addBlock = (type: BlockType) => {
    const tmp: BlockRow = {
      id: `tmp-${crypto.randomUUID()}`,
      block_type: type,
      position: blocks.length,
      data: { ...DEFAULTS[type] },
    };
    setBlocks([...blocks, tmp]);
  };

  const updateBlock = (id: string, patch: Partial<BlockRow>) => {
    setBlocks((cur) => cur.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const updateData = (id: string, key: string, value: unknown) => {
    setBlocks((cur) => cur.map((b) => (b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b)));
  };

  const move = (id: string, dir: -1 | 1) => {
    setBlocks((cur) => {
      const i = cur.findIndex((b) => b.id === id);
      if (i < 0) return cur;
      const j = i + dir;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((b, idx) => ({ ...b, position: idx }));
    });
  };

  const remove = (id: string) => {
    setBlocks((cur) => cur.filter((b) => b.id !== id).map((b, i) => ({ ...b, position: i })));
  };

  const save = async () => {
    setBusy(true);
    try {
      // Replace strategy: delete all then insert current
      await supabase.from("homepage_blocks").delete().not("id", "is", null);
      if (blocks.length) {
        const rows = blocks.map((b, i) => ({
          block_type: b.block_type,
          position: i,
          data: b.data,
        }));
        const { error } = await supabase.from("homepage_blocks").insert(rows);
        if (error) throw error;
      }
      toast.success("Homepage saved");
      const fresh = await loadBlocks();
      setBlocks(fresh);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/70 backdrop-blur-sm flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-vault-hairline bg-vault-bg">
        <h2 className="text-sm font-medium text-vault-fg">Homepage builder</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="px-3 py-1.5 rounded-md bg-vault-fg text-vault-bg text-xs font-medium hover:opacity-90 inline-flex items-center gap-1 disabled:opacity-50"
          >
            <FloppyDisk size={13} /> {busy ? "Saving…" : "Save & publish"}
          </button>
          <button onClick={onClose} className="p-2 rounded hover:bg-vault-overlay text-vault-fg-muted">
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-vault-bg">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-3">
          {blocks.length === 0 && (
            <div className="text-center py-12 text-sm text-vault-fg-muted">
              No blocks yet. Add one below to get started.
            </div>
          )}
          {blocks.map((b, i) => (
            <BlockEditor
              key={b.id}
              block={b}
              isFirst={i === 0}
              isLast={i === blocks.length - 1}
              onChange={(patch) => updateBlock(b.id, patch)}
              onChangeData={(key, val) => updateData(b.id, key, val)}
              onMoveUp={() => move(b.id, -1)}
              onMoveDown={() => move(b.id, 1)}
              onRemove={() => remove(b.id)}
            />
          ))}

          {/* Add block */}
          <div className="rounded-lg border border-dashed border-vault-hairline p-3 bg-vault-overlay">
            <div className="text-[11px] uppercase tracking-wider text-vault-fg-muted mb-2 flex items-center gap-1">
              <Plus size={12} /> Add block
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => addBlock(t)}
                  className="px-2.5 py-1 text-xs rounded border border-vault-hairline text-vault-fg hover:bg-vault-overlay-strong"
                >
                  + {BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  isFirst,
  isLast,
  onChangeData,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  block: BlockRow;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<BlockRow>) => void;
  onChangeData: (key: string, val: unknown) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-vault-hairline bg-vault-menu-bg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-vault-hairline bg-vault-overlay">
        <div className="text-xs font-medium text-vault-fg">{BLOCK_LABELS[block.block_type]}</div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={onMoveUp} disabled={isFirst} label="Up"><ArrowUp size={12} /></IconBtn>
          <IconBtn onClick={onMoveDown} disabled={isLast} label="Down"><ArrowDown size={12} /></IconBtn>
          <IconBtn onClick={onRemove} label="Delete" danger><Trash size={12} /></IconBtn>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <BlockFields type={block.block_type} data={block.data} onChange={onChangeData} />
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, danger, label }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`p-1.5 rounded ${danger ? "text-vault-danger hover:bg-vault-danger/15" : "text-vault-fg-muted hover:bg-vault-overlay-strong hover:text-vault-fg"} disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-vault-fg-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full px-2.5 py-1.5 bg-vault-bg border border-vault-hairline rounded-md text-xs text-vault-fg outline-none focus:border-vault-fg/40";

function BlockFields({ type, data, onChange }: { type: BlockType; data: Record<string, unknown>; onChange: (key: string, val: unknown) => void }) {
  const s = (k: string) => (data[k] as string | undefined) ?? "";
  if (type === "hero") {
    return (
      <>
        <Field label="Eyebrow"><input className={inputCls} value={s("eyebrow")} onChange={(e) => onChange("eyebrow", e.target.value)} /></Field>
        <Field label="Title"><input className={inputCls} value={s("title")} onChange={(e) => onChange("title", e.target.value)} /></Field>
        <Field label="Body"><textarea rows={2} className={inputCls} value={s("body")} onChange={(e) => onChange("body", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="CTA label"><input className={inputCls} value={s("ctaLabel")} onChange={(e) => onChange("ctaLabel", e.target.value)} /></Field>
          <Field label="CTA URL"><input className={inputCls} value={s("ctaUrl")} onChange={(e) => onChange("ctaUrl", e.target.value)} /></Field>
        </div>
      </>
    );
  }
  if (type === "text") {
    return (
      <>
        <Field label="Heading"><input className={inputCls} value={s("heading")} onChange={(e) => onChange("heading", e.target.value)} /></Field>
        <Field label="Body"><textarea rows={4} className={inputCls} value={s("body")} onChange={(e) => onChange("body", e.target.value)} /></Field>
      </>
    );
  }
  if (type === "channels") {
    return (
      <>
        <Field label="YouTube URL"><input className={inputCls} value={s("youtube")} onChange={(e) => onChange("youtube", e.target.value)} /></Field>
        <Field label="Telegram URL"><input className={inputCls} value={s("telegram")} onChange={(e) => onChange("telegram", e.target.value)} /></Field>
      </>
    );
  }
  if (type === "feature_grid") {
    const items = (data.items as { title: string; desc: string }[]) ?? [];
    return (
      <>
        <Field label="Heading"><input className={inputCls} value={s("heading")} onChange={(e) => onChange("heading", e.target.value)} /></Field>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 p-2 rounded border border-vault-hairline">
            <input className={inputCls} placeholder="Title" value={it.title} onChange={(e) => {
              const next = items.slice(); next[i] = { ...next[i], title: e.target.value }; onChange("items", next);
            }} />
            <input className={inputCls} placeholder="Description" value={it.desc} onChange={(e) => {
              const next = items.slice(); next[i] = { ...next[i], desc: e.target.value }; onChange("items", next);
            }} />
          </div>
        ))}
        <button className="text-xs text-vault-fg-muted hover:text-vault-fg" onClick={() => onChange("items", [...items, { title: "", desc: "" }])}>+ add item</button>
      </>
    );
  }
  if (type === "stats") {
    const items = (data.items as { label: string; value: string }[]) ?? [];
    return (
      <>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 p-2 rounded border border-vault-hairline">
            <input className={inputCls} placeholder="Label" value={it.label} onChange={(e) => {
              const next = items.slice(); next[i] = { ...next[i], label: e.target.value }; onChange("items", next);
            }} />
            <input className={inputCls} placeholder="Value" value={it.value} onChange={(e) => {
              const next = items.slice(); next[i] = { ...next[i], value: e.target.value }; onChange("items", next);
            }} />
          </div>
        ))}
        <button className="text-xs text-vault-fg-muted hover:text-vault-fg" onClick={() => onChange("items", [...items, { label: "", value: "" }])}>+ add stat</button>
      </>
    );
  }
  if (type === "image") {
    return (
      <>
        <Field label="Image URL"><input className={inputCls} value={s("url")} onChange={(e) => onChange("url", e.target.value)} /></Field>
        <Field label="Alt text"><input className={inputCls} value={s("alt")} onChange={(e) => onChange("alt", e.target.value)} /></Field>
        <Field label="Caption"><input className={inputCls} value={s("caption")} onChange={(e) => onChange("caption", e.target.value)} /></Field>
      </>
    );
  }
  // cta
  return (
    <>
      <Field label="Title"><input className={inputCls} value={s("title")} onChange={(e) => onChange("title", e.target.value)} /></Field>
      <Field label="Body"><textarea rows={2} className={inputCls} value={s("body")} onChange={(e) => onChange("body", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="CTA label"><input className={inputCls} value={s("ctaLabel")} onChange={(e) => onChange("ctaLabel", e.target.value)} /></Field>
        <Field label="CTA URL"><input className={inputCls} value={s("ctaUrl")} onChange={(e) => onChange("ctaUrl", e.target.value)} /></Field>
      </div>
    </>
  );
}
