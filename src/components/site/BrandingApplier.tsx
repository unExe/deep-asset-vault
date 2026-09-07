import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { fetchBranding } from "@/lib/site-settings";
import { isAdminUnlocked } from "@/lib/admin-api";

/** Applies live branding (title, favicon, tooltip) and the maintenance switch. */
export function BrandingApplier() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void fetchBranding().then((b) => {
      if (cancelled) return;
      if (b.siteTitle) document.title = b.siteTitle;
      if (b.description) {
        let el = document.querySelector('meta[name="description"]');
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute("name", "description");
          document.head.appendChild(el);
        }
        el.setAttribute("content", b.description);
      }
      if (b.faviconUrl) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = b.faviconUrl;
      }
      if (b.tooltip) document.body.title = b.tooltip;

      const path = location.pathname;
      const exempt =
        path.startsWith("/admin") ||
        path === "/maintenance" ||
        path === "/terms" ||
        path === "/privacy" ||
        path === "/cookies" ||
        path === "/support";
      if (b.maintenance && !exempt && !isAdminUnlocked()) {
        void navigate({ to: "/maintenance", replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  return null;
}
