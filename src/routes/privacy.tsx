import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, RichText, Section } from "@/components/site/PageShell";
import { fetchContent } from "@/lib/site-settings";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — vault.unExe" },
      {
        name: "description",
        content: "What vault.unExe stores, why it stores it, and how to have your data removed.",
      },
      { property: "og:title", content: "Privacy Policy — vault.unExe" },
      {
        property: "og:description",
        content: "What vault.unExe stores, why it stores it, and how to have your data removed.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://deep-asset-vault.lovable.app/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deep-asset-vault.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const [custom, setCustom] = useState<string | null>(null);
  useEffect(() => {
    void fetchContent().then((c) => setCustom(c.privacy.trim() || null));
  }, []);

  if (custom) {
    return (
      <PageShell
        title="Privacy Policy"
        intro="Short version: no accounts, no ad trackers, and only the minimum needed to keep the vault running."
      >
        <RichText text={custom} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Privacy Policy"
      intro="Short version: no accounts, no ad trackers, and only the minimum needed to keep the vault running."
      updated="September 2026"
    >
      <Section heading="What we collect">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-vault-fg">Visit statistics</strong> — the page you opened, where
            you came from, and a random visitor ID kept in your browser. No names, no IP addresses
            shown to us, no cross-site profiles.
          </li>
          <li>
            <strong className="text-vault-fg">Things you type</strong> — comments, material requests
            and support messages, including any contact detail you choose to add.
          </li>
          <li>
            <strong className="text-vault-fg">Local preferences</strong> — theme, favourites,
            keyboard shortcuts and read announcements, all stored in your own browser.
          </li>
        </ul>
      </Section>
      <Section heading="What we never collect">
        <p>
          No passwords for you (there are no visitor accounts), no payment data, no email marketing
          lists, and no advertising or fingerprinting scripts.
        </p>
      </Section>
      <Section heading="Where it is stored">
        <p>
          Data lives in a managed Postgres database and object storage operated by the site's
          backend provider. Files you download may be served from Google Drive when an item is
          embedded from there.
        </p>
      </Section>
      <Section heading="How long we keep it">
        <p>
          Visit statistics are only ever read in aggregate and are kept for at most 90 days.
          Comments and requests stay until you or the site owner deletes them.
        </p>
      </Section>
      <Section heading="Your choices">
        <p>
          You can clear everything stored in your browser from the{" "}
          <Link to="/cookies" className="text-vault-fg underline underline-offset-4">
            cookies preferences page
          </Link>
          , and you can ask for a comment or request to be deleted through{" "}
          <Link to="/support" className="text-vault-fg underline underline-offset-4">
            support
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
