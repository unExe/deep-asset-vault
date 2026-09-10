import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  House,
  Star,
  Folder as FolderIcon,
  X as XIcon,
  List,
  CaretRight,
  CaretLeft,
  HandHeart,
  Bell,
} from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { Favorites, useFavorites } from "@/lib/favorites";
import { FileTypeChart } from "./FileTypeChart";
import { aUpdate } from "@/lib/admin-api";
import { useAnnouncements } from "@/lib/announcements";
import { AnnouncementsCard } from "./AnnouncementsCard";
import { NotificationModal } from "./NotificationModal";
import { RequestMaterialDialog } from "./RequestMaterialDialog";

interface PinnedFolder {
  id: string;
  name: string;
}

interface Props {
  isEditorMode: boolean;
  currentFolderId: string | null;
  onNavigateFolder: (id: string | null) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function VaultSidebar({
  isEditorMode,
  currentFolderId,
  onNavigateFolder,
  collapsed = false,
  onToggleCollapsed,
}: Props) {
  const [pinned, setPinned] = useState<PinnedFolder[]>([]);
  const [openMobile, setOpenMobile] = useState(false);
  const [flyout, setFlyout] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const favs = useFavorites();
  const { items: announcements, unread } = useAnnouncements();

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
    const onOpen = () => setOpenMobile(true);
    const onNotif = () => setNotifOpen(true);
    window.addEventListener("vault:pinned-changed", onPinChange);
    window.addEventListener("vault:open-sidebar", onOpen);
    window.addEventListener("vault:open-notifications", onNotif);
    return () => {
      window.removeEventListener("vault:pinned-changed", onPinChange);
      window.removeEventListener("vault:open-sidebar", onOpen);
      window.removeEventListener("vault:open-notifications", onNotif);
    };
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
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="ml-auto hidden md:block p-1 rounded hover:bg-vault-overlay text-vault-fg-muted transition-colors"
            aria-label="Collapse sidebar"
          >
            <CaretLeft size={16} />
          </button>
        )}
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
          <SidebarBtn
            icon={<HandHeart size={15} />}
            label="Request Material"
            onClick={() => {
              setRequestOpen(true);
              setOpenMobile(false);
            }}
          />
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

  const railBody = (
    <div className="flex flex-col items-center h-full py-4 gap-2">
      <button
        onClick={onToggleCollapsed}
        className="p-2 rounded-md hover:bg-vault-overlay text-vault-fg-muted"
        aria-label="Expand sidebar"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => onNavigateFolder(null)}
        className={`p-2 rounded-md hover:bg-vault-overlay ${currentFolderId === null ? "bg-vault-overlay-strong text-vault-fg" : "text-vault-fg/85"}`}
        aria-label="Home"
      >
        <House size={16} />
      </button>
      <Link
        to="/vault/favorites"
        className="p-2 rounded-md hover:bg-vault-overlay text-vault-fg/85"
        aria-label={`Favorites (${favs.length})`}
      >
        <Star size={16} />
      </Link>
      <button
        onClick={() => setRequestOpen(true)}
        className="p-2 rounded-md hover:bg-vault-overlay text-vault-fg/85"
        aria-label="Request Material"
        title="Request Material"
      >
        <HandHeart size={16} />
      </button>
      <button
        onClick={() => setNotifOpen(true)}
        className="relative p-2 rounded-md hover:bg-vault-overlay text-vault-fg/85"
        aria-label="Announcements"
        title="Announcements"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-vault-accent" />
        )}
      </button>

      <div
        className="relative"
        onMouseEnter={() => setFlyout(true)}
        onMouseLeave={() => setFlyout(false)}
      >
        <button
          className={`p-2 rounded-md hover:bg-vault-overlay ${flyout ? "bg-vault-overlay-strong text-vault-fg" : "text-vault-fg/85"}`}
          aria-label="Folders u should checkout"
        >
          <CaretRight size={16} />
        </button>
        {flyout && (
          <div className="absolute left-full top-0 ml-1 w-56 rounded-lg bg-vault-menu-bg border border-vault-hairline shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-left-2 duration-150">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-vault-fg-muted">
              Folders u should checkout
            </div>
            {pinned.length === 0 ? (
              <div className="px-2 py-1.5 text-[11px] text-vault-fg-muted">Nothing pinned yet</div>
            ) : (
              pinned.map((p) => (
                <SidebarBtn
                  key={p.id}
                  icon={<FolderIcon size={15} weight="fill" className="text-vault-folder" />}
                  label={p.name}
                  active={currentFolderId === p.id}
                  onClick={() => {
                    onNavigateFolder(p.id);
                    setFlyout(false);
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 z-30 overflow-hidden bg-vault-menu-bg border-r border-vault-hairline transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          collapsed ? "md:w-14" : "md:w-64"
        }`}
      >
        <div
          key={collapsed ? "rail" : "full"}
          className="h-full w-full animate-in fade-in duration-300"
        >
          {collapsed ? railBody : sidebarBody}
        </div>
      </aside>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
            onClick={() => setOpenMobile(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-vault-menu-bg border-r border-vault-hairline flex flex-col animate-in slide-in-from-left duration-300 ease-out">
            {sidebarBody}
          </aside>
        </div>
      )}

      {notifOpen && (
        <NotificationModal items={announcements} onClose={() => setNotifOpen(false)} />
      )}
      {requestOpen && <RequestMaterialDialog onClose={() => setRequestOpen(false)} />}
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
  await aUpdate("folders", id, { sidebar_pinned: next });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("vault:pinned-changed"));
  return next;
}

export { Favorites };
