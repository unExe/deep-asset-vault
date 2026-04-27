import { createFileRoute } from "@tanstack/react-router";
import { AssetVaultApp } from "@/components/vault/AssetVaultApp";

export const Route = createFileRoute("/")({
  component: () => <AssetVaultApp isEditorMode={false} />,
});
