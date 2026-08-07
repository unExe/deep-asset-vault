import { useEffect, useState } from "react";
import { CaretRight, House, ArrowLeft, ArrowRight, ArrowUp, ArrowClockwise, MagnifyingGlass } from "@phosphor-icons/react";
import { getBreadcrumbs, resolvePath, type Folder } from "@/hooks/useFileSystem";

interface Props {
  folderId: string | null;
  onNavigate: (id: string | null) => void;
  onBack: () => void;
  onForward: () => void;
  canBack: boolean;
  canForward: boolean;
  onRefresh: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  /** Rendered before the nav arrows (e.g. mobile menu button). */
  leading?: React.ReactNode;
  /** Header actions: top-right on mobile, inline on desktop. */
  actions?: React.ReactNode;
}

export function PathBar({
  folderId,
  onNavigate,
  onBack,
  onForward,
  canBack,
  canForward,
  onRefresh,
  search,
  onSearchChange,
  leading,
  actions,
}: Props) {
  const [trail, setTrail] = useState<Folder[]>([]);
  const [editing, setEditing] = useState(false);
  const [pathStr, setPathStr] = useState("");

  useEffect(() => {
    void getBreadcrumbs(folderId).then(setTrail);
  }, [folderId]);

  useEffect(() => {
    setPathStr("/" + trail.map((t) => t.name).join("/"));
  }, [trail]);

  const goUp = () => {
    if (trail.length === 0) return;
    const parent = trail[trail.length - 2];
    onNavigate(parent ? parent.id : null);
  };

  const submitPath = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = await resolvePath(pathStr);
    onNavigate(id);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
      {/* Nav arrows */}
      <div className="flex items-center gap-0.5 sm:shrink-0">
        {leading}
        <button
          onClick={onBack}
          disabled={!canBack}
          className="p-1.5 rounded hover:bg-vault-overlay-strong disabled:opacity-30 text-vault-fg"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          onClick={onForward}
          disabled={!canForward}
          className="p-1.5 rounded hover:bg-vault-overlay-strong disabled:opacity-30 text-vault-fg"
          aria-label="Forward"
        >
          <ArrowRight size={16} />
        </button>
        <button
          onClick={goUp}
          disabled={trail.length === 0}
          className="p-1.5 rounded hover:bg-vault-overlay-strong disabled:opacity-30 text-vault-fg"
          aria-label="Up"
        >
          <ArrowUp size={16} />
        </button>
      </div>

      {/* Path */}
      <div className="flex-1 min-w-0 h-8 bg-vault-overlay hover:bg-vault-overlay-strong border border-vault-hairline rounded-md flex items-center px-2">
        {editing ? (
          <form onSubmit={submitPath} className="flex-1">
            <input
              autoFocus
              value={pathStr}
              onChange={(e) => setPathStr(e.target.value)}
              onBlur={() => setEditing(false)}
              placeholder="/Folder/Subfolder"
              className="w-full bg-transparent outline-none text-sm text-vault-fg"
            />
          </form>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="flex items-center gap-0.5 text-sm text-vault-fg-muted overflow-x-auto whitespace-nowrap flex-1 cursor-text"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(null);
              }}
              className="flex items-center gap-1 hover:bg-vault-overlay-strong rounded px-1.5 py-0.5"
            >
              <House size={13} />
              <span className="hidden sm:inline">Home</span>
            </button>
            {trail.map((f) => (
              <div key={f.id} className="flex items-center gap-0.5">
                <CaretRight size={11} className="opacity-40" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(f.id);
                  }}
                  className="hover:bg-vault-overlay-strong rounded px-1.5 py-0.5 text-vault-fg"
                >
                  {f.name}
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onRefresh}
          className="p-1 rounded hover:bg-vault-overlay-strong text-vault-fg-muted ml-1"
          aria-label="Refresh"
        >
          <ArrowClockwise size={13} />
        </button>
      </div>

      {/* Search (desktop) */}
      <div className="hidden sm:flex items-center gap-1.5 h-8 w-48 lg:w-64 bg-vault-overlay border border-vault-hairline rounded-md px-2.5">
        <MagnifyingGlass size={13} className="text-vault-fg-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${trail.length ? trail[trail.length - 1].name : "Vault"}`}
          className="flex-1 bg-transparent outline-none text-xs text-vault-fg placeholder:text-vault-fg-muted"
        />
      </div>
    </div>
  );
}
