import { createFileRoute } from "@tanstack/react-router";
import { AssetVaultApp } from "@/components/vault/AssetVaultApp";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "vault.unExe" },
      { name: "description", content: "vault.unExe — folder-based asset vault." },
    ],
  }),
  component: () => <AssetVaultApp isEditorMode={false} />,
});
