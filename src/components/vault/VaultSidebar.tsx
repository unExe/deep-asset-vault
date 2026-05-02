import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  House,
  Star,
  Folder as FolderIcon,
  X as XIcon,
  List,
  Article,
} from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { Favorites, useFavorites } from "@/lib/favorites";
import { FileTypeChart } from "./FileTypeChart";

interface PinnedFolder {
  id: string;
  name: string;
}

interface Props {
  isEditorMode: boolean;
  currentFolderId: string | null;
  onNavigateFolder: (id: string | null) => void;
}

export function VaultSidebar({ isEditorMode, currentFolderId, onNavigateFolder }: Props) {
  const [pinned, setPinned] = useState<PinnedFolder[]>([]);
  const [openMobile, setOpenMobile] = useState(false);
  const favs = useFavorites();

  const refreshPinned = async () => {
    const { data } = await supabase
      .from("folders")
      .select("id,name")
      .eq("sidebar_pinned", true)
      .order("name");
    setPinned((data as PinnedFolder[] | null) ?? []);
  };

  useEffect(() => {
    void refreshPinned();
  }, []);

  // Re-fetch when storage event fires (favorites changed elsewhere)
  // Also expose a refresh listener for pinned via window event
  useEffect(() => {
    const onPinChange = () => void refreshPinned();
    window.addEventListener("vault:pinned-changed", onPinChange);
    return () => window.removeEventListener("vault:pinned-changed", onPinChange);
  }, []);

  const sidebarBody = (
    <div className="flex flex-col h-full text-vault-fg">
      <div className="px-4 py-4 border-b border-vault-hairline flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-vault-fg" />
        <span className="font-medium tracking-tight text-sm">vault.unExe</span>
        <button
          onClick={() => setOpenMobile(false)}
          className="ml-auto md:hidden p-1 rounded hover:bg-vault-overlay text-vault-fg-muted"
          aria-label="Close sidebar"
        >
          <XIcon size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Basic */}
        <div>
          <div className="px-2 text-[10px] uppercase tracking-wider text-vault-fg-muted mb-1">Basic</div>
          <SidebarBtn
            icon={<House size={15} />}
            label="Home"
            active={currentFolderId === null}
            onClick={() => {
              onNavigateFolder(null);
              setOpenMobile(false);
            }}
          />
          <SidebarLink icon={<Star size={15} />} label={`Favorites (${favs.length})`} to="/vault/favorites" onClick={() => setOpenMobile(false)} />
        </div>

        {/* Pinned folders */}
        <div>
          <div className="px-2 text-[10px] uppercase tracking-wider text-vault-fg-muted mb-1">
            Folders u should checkout
          </div>
          {pinned.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-vault-fg-muted">
              {isEditorMode ? "Right-click a folder → Add to sidebar" : "Nothing pinned yet"}
            </div>
          ) : (
            pinned.map((p) => (
              <SidebarBtn
                key={p.id}
                icon={<FolderIcon size={15} weight="fill" className="text-vault-folder" />}
                label={p.name}
                active={currentFolderId === p.id}
                onClick={() => {
                  onNavigateFolder(p.id);
                  setOpenMobile(false);
                }}
              />
            ))
          )}
        </div>
      </nav>

      <div className="border-t border-vault-hairline p-2">
        <FileTypeChart />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setOpenMobile(true)}
        className="md:hidden fixed bottom-20 left-3 z-40 p-2.5 rounded-full bg-vault-menu-bg border border-vault-hairline shadow-xl text-vault-fg"
        aria-label="Open sidebar"
      >
        <List size={18} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 z-30 bg-vault-menu-bg border-r border-vault-hairline">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenMobile(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-vault-menu-bg border-r border-vault-hairline flex flex-col">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${
        active ? "bg-vault-overlay-strong text-vault-fg" : "text-vault-fg/85 hover:bg-vault-overlay"
      }`}
    >
      <span className="w-4 flex justify-center shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function SidebarLink({
  icon,
  label,
  to,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-left text-vault-fg/85 hover:bg-vault-overlay transition-colors"
      activeProps={{ className: "bg-vault-overlay-strong text-vault-fg" }}
    >
      <span className="w-4 flex justify-center shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

/** Pin/unpin helper. Triggers refresh in any mounted sidebar. */
export async function togglePinFolder(id: string): Promise<boolean> {
  const { data: cur, error: readErr } = await supabase
    .from("folders")
    .select("sidebar_pinned")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;
  const next = !((cur as { sidebar_pinned: boolean } | null)?.sidebar_pinned);
  const { error: upErr } = await supabase.from("folders").update({ sidebar_pinned: next }).eq("id", id);
  if (upErr) throw upErr;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("vault:pinned-changed"));
  return next;
}

export { Favorites };
