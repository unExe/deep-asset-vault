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
    <div className="flex items-center gap-1 text-sm text-white/50 overflow-x-auto whitespace-nowrap">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1.5 hover:text-white transition-colors px-1"
      >
        <House size={15} weight="regular" />
        <span>Home</span>
      </button>
      {trail.map((f) => (
        <div key={f.id} className="flex items-center gap-1">
          <CaretRight size={12} weight="regular" className="opacity-40" />
          <button
            onClick={() => onNavigate(f.id)}
            className="hover:text-white transition-colors px-1"
          >
            {f.name}
          </button>
        </div>
      ))}
      {selectedCount && selectedCount > 0 ? (
        <>
          <CaretRight size={12} weight="regular" className="opacity-40" />
          <span className="text-white/80">({selectedCount} selected)</span>
        </>
      ) : null}
    </div>
  );
}
