import { X } from "@phosphor-icons/react";
import { getPublicUrl, type Asset } from "@/hooks/useFileSystem";

export function PreviewModal({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  if (!asset) return null;
  const url = getPublicUrl(asset.storage_path);
  const isImg = asset.file_type?.startsWith("image/");
  const isVid = asset.file_type?.startsWith("video/");
  const isAud = asset.file_type?.startsWith("audio/");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-vault-card hover:bg-vault-card-hover text-vault-fg"
      >
        <X size={20} />
      </button>
      <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-full">
        {isImg && <img src={url} alt={asset.name} className="max-h-[85vh] rounded-lg" />}
        {isVid && <video src={url} controls className="max-h-[85vh] rounded-lg" />}
        {isAud && <audio src={url} controls className="w-96" />}
        {!isImg && !isVid && !isAud && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-vault-accent underline"
          >
            Open {asset.name}
          </a>
        )}
        <p className="text-center text-vault-fg-muted text-sm mt-3">{asset.name}</p>
      </div>
    </div>
  );
}
