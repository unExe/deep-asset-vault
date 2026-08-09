import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AssetVaultApp } from "@/components/vault/AssetVaultApp";
import { LockKey } from "@phosphor-icons/react";
import { adminSignIn, isAdminUnlocked } from "@/lib/admin-api";


export const Route = createFileRoute("/admin/letmeupload")({
  component: AdminGate,
});

function AdminGate() {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAdminUnlocked()) setUnlocked(true);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await adminSignIn(pw);
      setUnlocked(true);
    } catch {
      setErr(true);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  if (unlocked) return <AssetVaultApp isEditorMode />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-xl p-8"
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-white/10">
            <LockKey size={24} weight="fill" className="text-white" />
          </div>
          <h1 className="text-base font-medium">Editor Access</h1>
          <p className="text-xs text-white/50 text-center">
            Enter the editor password to unlock upload &amp; delete.
          </p>
        </div>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr(false);
          }}
          autoFocus
          placeholder="Password"
          className="w-full px-3 py-2 bg-black border border-white/15 rounded-md text-sm focus:outline-none focus:border-white/40"
        />
        {err && <p className="text-xs text-red-400 mt-2">Incorrect password</p>}
        <button
          type="submit"
          className="w-full mt-4 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
