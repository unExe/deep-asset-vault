import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Section } from "@/components/site/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — vault.unExe" },
      {
        name: "description",
        content: "The rules for using vault.unExe: downloads, uploads, licensing and acceptable use.",
      },
      { property: "og:title", content: "Terms & Conditions — vault.unExe" },
      {
        property: "og:description",
        content: "The rules for using vault.unExe: downloads, uploads, licensing and acceptable use.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://deep-asset-vault.lovable.app/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deep-asset-vault.lovable.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell
      title="Terms & Conditions"
      intro="By browsing, previewing or downloading anything from vault.unExe you agree to the terms below."
      updated="September 2026"
    >
      <Section heading="1. What this site is">
        <p>
          vault.unExe is a personal library of editing assets — overlays, sound effects, presets and
          project files — shared by the creator unExe. Access is free and provided as-is, with no
          guarantee of uptime, completeness or continued availability of any file.
        </p>
      </Section>
      <Section heading="2. How you may use the assets">
        <p>
          You may use the assets in your own edits and videos, including monetised ones. You may not
          resell, repackage or redistribute the files as your own asset pack, and you may not claim
          authorship of assets you did not create.
        </p>
      </Section>
      <Section heading="3. Third-party content">
        <p>
          Some items are embedded from or linked to external services such as Google Drive and
          YouTube. Those files stay on the original service and remain subject to that service's own
          terms. If you are the rights holder of something hosted here and want it removed, contact
          us through the support page and it will be taken down.
        </p>
      </Section>
      <Section heading="4. Acceptable use">
        <p>
          Do not attempt to break, overload or gain unauthorised access to the site, its admin area
          or its storage. Automated scraping or bulk downloading that degrades the service is not
          allowed. Comments and material requests must stay respectful and legal.
        </p>
      </Section>
      <Section heading="5. Liability">
        <p>
          The assets are provided without warranty of any kind. The creator is not liable for any
          loss, damage or claim arising from your use of a file downloaded here. Always verify that
          a given asset fits the licensing needs of your own project.
        </p>
      </Section>
      <Section heading="6. Changes">
        <p>
          These terms may change as the vault grows. Continued use after an update means you accept
          the revised terms.
        </p>
      </Section>
    </PageShell>
  );
}
