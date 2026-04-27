import { X, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { getPublicUrl, type Asset } from "@/hooks/useFileSystem";

interface Props {
  assets: Asset[]; // queue (1 or many for bulk preview)
  startIndex?: number;
  onClose: () => void;
}

export function PreviewModal({ assets, startIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex);
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
      >
        <X size={18} />
      </button>

      {assets.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => Math.max(i - 1, 0));
            }}
            disabled={idx === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 disabled:opacity-30"
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
          >
            <CaretRight size={20} />
          </button>
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/10 text-white text-xs">
            {idx + 1} / {assets.length}
          </div>
        </>
      )}

      <div onClick={(e) => e.stopPropagation()} className="max-w-6xl w-full max-h-full flex flex-col items-center gap-3">
        {isImg && (
          <img src={url} alt={asset.name} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
        )}
        {isVid && <VideoJsPlayer key={url} src={url} type={asset.file_type ?? undefined} />}
        {isAud && <audio src={url} controls className="w-full max-w-md" autoPlay />}
        {!isImg && !isVid && !isAud && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-white underline text-sm"
          >
            Open {asset.name}
          </a>
        )}
        <p className="text-center text-white/60 text-sm truncate max-w-full px-4">{asset.name}</p>
      </div>
    </div>
  );
}

function VideoJsPlayer({ src, type }: { src: string; type?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const videoEl = document.createElement("video-js");
    videoEl.classList.add("vjs-big-play-centered", "vjs-fluid");
    ref.current.appendChild(videoEl);
    const player = videojs(videoEl, {
      controls: true,
      autoplay: false,
      preload: "auto",
      fluid: true,
      sources: [{ src, type: type || "video/mp4" }],
    });
    playerRef.current = player;
    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [src, type]);

  return (
    <div data-vjs-player className="w-full max-w-5xl max-h-[80vh]">
      <div ref={ref} />
    </div>
  );
}
