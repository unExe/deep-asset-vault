/** Google Analytics (gtag.js) + first-party page-view logging. */
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/visitor";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as
  | string
  | undefined;

let gaReady = false;

export function initAnalytics() {
  if (typeof window === "undefined" || gaReady) return;
  gaReady = true;
  if (!MEASUREMENT_ID) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID);
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  if (MEASUREMENT_ID && window.gtag) {
    window.gtag("event", "page_view", { page_path: path });
  }
  void supabase
    .from("page_views")
    .insert({
      path: path.slice(0, 300),
      referrer: (document.referrer || "").slice(0, 300) || null,
      visitor_id: getVisitorId(),
    })
    .then(() => undefined);
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && MEASUREMENT_ID && window.gtag) {
    window.gtag("event", name, params ?? {});
  }
}
