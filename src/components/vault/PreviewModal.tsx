import { X, CaretLeft, CaretRight, DownloadSimple, Info } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { getPublicUrl, type Asset } from "@/hooks/useFileSystem";
import { AssetInfoDialog } from "./InfoDialog";
import { triggerDownload } from "@/lib/vault-ops";

interface Props {
  assets: Asset[];
  startIndex?: number;
  onClose: () => void;
}

export function PreviewModal({ assets = [], startIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => setIdx(startIndex), [startIndex, assets]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, assets.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assets.length, onClose]);

  if (assets.length === 0) return null;
  const asset = assets[idx];
  if (!asset) return null;

  const url = getPublicUrl(asset.storage_path);
  const isImg = asset.file_type?.startsWith("image/");
  const isVid = asset.file_type?.startsWith("video/");
  const isAud = asset.file_type?.startsWith("audio/");
  const isText =
    asset.file_type?.startsWith("text/") || asset.name.toLowerCase().endsWith(".txt") || asset.name.toLowerCase().endsWith(".md");

  const handleDownload = async () => {
    const blob = await fetch(url).then((r) => r.blob());
    triggerDownload(blob, asset.name);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
    >
      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          {assets.length > 1 && (
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs">
              {idx + 1} / {assets.length}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs truncate max-w-[40vw]">
            {asset.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Info"
          >
            <Info size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Download"
          >
            <DownloadSimple size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {assets.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => Math.max(i - 1, 0));
            }}
            disabled={idx === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 disabled:opacity-30"
            aria-label="Previous"
          >
            <CaretLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => Math.min(i + 1, assets.length - 1));
            }}
            disabled={idx === assets.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 disabled:opacity-30"
            aria-label="Next"
          >
            <CaretRight size={20} />
          </button>
        </>
      )}

      <div onClick={(e) => e.stopPropagation()} className="max-w-6xl w-full max-h-full flex flex-col items-center gap-3 mt-12">
        {isImg && (
          <img src={url} alt={asset.name} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
        )}
        {isVid && (
          <video
            key={url}
            src={url}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] max-w-full rounded-lg bg-black"
          />
        )}
        {isAud && <audio src={url} controls className="w-full max-w-md" autoPlay />}
        {isText && (
          <iframe src={url} title={asset.name} className="w-full h-[75vh] bg-white rounded-lg" />
        )}
        {!isImg && !isVid && !isAud && !isText && (
          <a href={url} target="_blank" rel="noreferrer" className="text-white underline text-sm">
            Open {asset.name}
          </a>
        )}
      </div>

      {showInfo && <AssetInfoDialog asset={asset} onClose={() => setShowInfo(false)} />}
    </div>
  );
}
