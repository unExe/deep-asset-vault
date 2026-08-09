import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { LockKey } from "@phosphor-icons/react";
import { adminSignIn, isAdminUnlocked, aResetPasswordWithPet } from "@/lib/admin-api";

/** Shared password gate used by every /admin route. */
export function AdminGate({ title, children }: { title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [recover, setRecover] = useState(false);
  const [pet, setPet] = useState("");
  const [newPw, setNewPw] = useState("");

  useEffect(() => {
    setMounted(true);
    if (isAdminUnlocked()) setUnlocked(true);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      if (recover) {
        await aResetPasswordWithPet(pet, newPw);
      } else {
        await adminSignIn(pw);
      }
      setUnlocked(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong");
    }
  };

  if (!mounted) return <div className="min-h-screen bg-vault-bg" />;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-vault-bg text-vault-fg p-6">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-sm bg-vault-overlay border border-vault-hairline rounded-xl p-8"
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-vault-overlay-strong">
            <LockKey size={24} weight="fill" />
          </div>
          <h1 className="text-base font-medium">{title}</h1>
          <p className="text-xs text-vault-fg-muted text-center">
            {recover
              ? "Answer the recovery question to set a new password."
              : "Enter the admin password to continue."}
          </p>
        </div>

        {recover ? (
          <div className="space-y-3">
            <label className="block text-xs text-vault-fg-muted">Pet name?</label>
            <input
              value={pet}
              onChange={(e) => setPet(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm focus:outline-none focus:border-vault-fg/40"
            />
            <label className="block text-xs text-vault-fg-muted">New password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              minLength={6}
              className="w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm focus:outline-none focus:border-vault-fg/40"
            />
          </div>
        ) : (
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr(null);
            }}
            autoFocus
            placeholder="Password"
            className="w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm focus:outline-none focus:border-vault-fg/40"
          />
        )}

        {err && <p className="text-xs text-red-400 mt-2">{err}</p>}

        <button
          type="submit"
          className="w-full mt-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {recover ? "Reset & unlock" : "Unlock"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRecover((r) => !r);
            setErr(null);
          }}
          className="w-full mt-3 text-xs text-vault-fg-muted hover:text-vault-fg transition-colors"
        >
          {recover ? "Back to password" : "Forgot password?"}
        </button>
      </form>
    </div>
  );
}
