import { useEffect, useState } from "react";
import { CaretRight, House } from "@phosphor-icons/react";
import { getBreadcrumbs, type Folder } from "@/hooks/useFileSystem";

interface Props {
  folderId: string | null;
  onNavigate: (id: string | null) => void;
  selectedCount?: number;
}

export function Breadcrumbs({ folderId, onNavigate, selectedCount }: Props) {
  const [trail, setTrail] = useState<Folder[]>([]);

  useEffect(() => {
    void getBreadcrumbs(folderId).then(setTrail);
  }, [folderId]);

  return (
    <div className="flex items-center gap-1.5 text-sm text-vault-fg-muted overflow-x-auto whitespace-nowrap">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1.5 hover:text-vault-fg transition-colors px-1"
      >
        <House size={16} weight="regular" />
        <span>Home</span>
      </button>
      {trail.map((f) => (
        <div key={f.id} className="flex items-center gap-1.5">
          <CaretRight size={14} weight="regular" className="opacity-60" />
          <button
            onClick={() => onNavigate(f.id)}
            className="hover:text-vault-fg transition-colors px-1"
          >
            {f.name}
          </button>
        </div>
      ))}
      {selectedCount && selectedCount > 0 ? (
        <>
          <CaretRight size={14} weight="regular" className="opacity-60" />
          <span className="text-vault-accent">({selectedCount} selected)</span>
        </>
      ) : null}
    </div>
  );
}
