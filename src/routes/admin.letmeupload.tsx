import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AssetVaultApp } from "@/components/vault/AssetVaultApp";
import { LockKey } from "@phosphor-icons/react";

const ADMIN_PASSWORD = "letmeupload";
const STORAGE_KEY = "assetvault_admin_unlocked";

export const Route = createFileRoute("/admin/letmeupload")({
  component: AdminGate,
});

function AdminGate() {
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1",
  );
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setErr(true);
    }
  };

  if (unlocked) return <AssetVaultApp isEditorMode />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-vault-bg text-vault-fg p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-vault-card border border-vault-border rounded-xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-vault-accent/10">
            <LockKey size={28} weight="fill" className="text-vault-accent" />
          </div>
          <h1 className="text-lg font-semibold">Editor Access</h1>
          <p className="text-xs text-vault-fg-muted text-center">
            Enter the editor password to unlock upload & delete.
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
          className="w-full px-3 py-2 bg-vault-bg border border-vault-border rounded-md text-sm focus:outline-none focus:border-vault-accent"
        />
        {err && <p className="text-xs text-destructive mt-2">Incorrect password</p>}
        <button
          type="submit"
          className="w-full mt-4 py-2 rounded-md bg-vault-accent text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
