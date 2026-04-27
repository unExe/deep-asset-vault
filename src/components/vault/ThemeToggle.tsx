import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-1.5 rounded-md hover:bg-vault-overlay-strong text-vault-fg-muted hover:text-vault-fg transition-colors shrink-0"
    >
      {theme === "dark" ? <Sun size={15} weight="duotone" /> : <Moon size={15} weight="duotone" />}
    </button>
  );
}
