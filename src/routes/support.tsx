import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LifebuoyIcon } from "@phosphor-icons/react";
import { PageShell, Section } from "@/components/site/PageShell";
import { submitMaterialRequest } from "@/lib/announcements";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — vault.unExe" },
      {
        name: "description",
        content: "Report a broken download, request an asset, or get help using vault.unExe.",
      },
      { property: "og:title", content: "Support — vault.unExe" },
      {
        property: "og:description",
        content: "Report a broken download, request an asset, or get help using vault.unExe.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deep-asset-vault.lovable.app/support" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deep-asset-vault.lovable.app/support" }],
  }),
  component: SupportPage,
});

const FAQ = [
  {
    q: "A download does nothing or fails halfway.",
    a: "Large files can time out on a weak connection. Try again, and if it still fails use the preview window's download button, which fetches the file directly.",
  },
  {
    q: "A folder looks empty.",
    a: "Folders embedded from Google Drive load their contents live. If the share link was revoked, the folder shows nothing — send it in through the form below and it will be re-linked.",
  },
  {
    q: "My favourites disappeared.",
    a: "Favourites are stored in your browser. Clearing site data, using private browsing, or switching device or browser resets them.",
  },
  {
    q: "Uploads say my session expired.",
    a: "The editor unlock lasts for one browser session. Unlock again from the admin entrance and retry the upload.",
  },
];

function SupportPage() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await submitMaterialRequest({ title: title.trim(), details, contact });
      setSent(true);
      setTitle("");
      setDetails("");
      setContact("");
      toast.success("Message sent — thank you!");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? `Couldn't send: ${err.message}`
          : "Couldn't send your message. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 bg-vault-bg border border-vault-hairline rounded-md text-sm text-vault-fg focus:outline-none focus:border-vault-fg/40";

  return (
    <PageShell
      title="Support"
      intro="Something broken, missing, or confusing? Send it over — every message lands in the admin inbox."
    >
      <Section heading="Common questions">
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="rounded-lg border border-vault-hairline bg-vault-overlay p-4 group"
            >
              <summary className="cursor-pointer text-sm font-medium text-vault-fg select-none">
                {f.q}
              </summary>
              <p className="mt-2 text-xs leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section heading="Send a message">
        {sent ? (
          <div className="rounded-lg border border-vault-hairline bg-vault-overlay p-6 text-center">
            <LifebuoyIcon size={22} weight="duotone" className="mx-auto text-vault-fg" />
            <p className="mt-3 text-sm text-vault-fg">Message received.</p>
            <p className="mt-1 text-xs">If you left a contact, you'll hear back there.</p>
            <button onClick={() => setSent(false)} className="mt-4 text-xs underline underline-offset-4">
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs">Subject</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                placeholder="Broken download in Overlays"
                className={inputCls}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs">Details</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="What happened, which folder or file, and what you expected."
                className={inputCls}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs">How to reach you (optional)</span>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={200}
                placeholder="Telegram, email, or YouTube handle"
                className={inputCls}
              />
            </label>
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-vault-fg text-vault-bg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </Section>

      <Section heading="Other ways">
        <p>
          You can also reach unExe through the channels linked on the{" "}
          <Link to="/" className="text-vault-fg underline underline-offset-4">
            home page
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
