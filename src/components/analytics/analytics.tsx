"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type GtagFn = (
  command: string,
  targetOrField: string,
  fieldOrValue?: string | ((value: string) => void),
  cb?: (value: string) => void,
) => void;

type ClarityFn = (command: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    clarity?: ClarityFn;
    dataLayer?: unknown[];
  }
}

type AnalyticsProps = {
  /** Google Analytics 4 measurement ID (e.g. G-XXXX). */
  gaId?: string;
  /** Google Tag Manager container ID (e.g. GTM-XXXX). Loads Microsoft Clarity. */
  gtmId?: string;
};

/**
 * Loads Google Analytics and Google Tag Manager with a guaranteed order:
 * GA (gtag.js) is initialized FIRST, and only once it has loaded do we
 * initialize GTM — which is what enables Microsoft Clarity. This ensures
 * Google Analytics is ready before the Clarity tag fires.
 *
 * Both use the shared `dataLayer`, so GA's `config` is queued before GTM starts.
 *
 * After both are ready, the GA `client_id` is read via `gtag('get', …)` and set
 * as a Clarity custom tag named `ga_client_id`, so sessions can be correlated
 * with GA in the Clarity dashboard.
 */
export function Analytics({ gaId, gtmId }: AnalyticsProps) {
  // If there is no GA to wait for, GTM is free to load immediately.
  const [gaReady, setGaReady] = useState<boolean>(!gaId);

  useEffect(() => {
    // Requires GA (library loaded) and Clarity (loaded via GTM) to be present.
    if (!gaId || !gaReady) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40; // ~10s at 250ms

    const trySetClarityTag = () => {
      if (cancelled) return;
      const { gtag, clarity } = window;
      if (typeof gtag === "function" && typeof clarity === "function") {
        gtag("get", gaId, "client_id", (clientId: string) => {
          if (cancelled || !clientId) return;
          // Set a named, unmasked Clarity custom tag with the GA client_id.
          clarity("set", "ga_client_id", String(clientId));
        });
        return;
      }
      if (attempts++ < maxAttempts) {
        window.setTimeout(trySetClarityTag, 250);
      }
    };

    trySetClarityTag();
    return () => {
      cancelled = true;
    };
  }, [gaId, gaReady]);

  return (
    <>
      {gaId ? (
        <>
          <Script
            id="ga-lib"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            onReady={() => setGaReady(true)}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');
gtag('event', 'conversion_event_page_view');`}
          </Script>
        </>
      ) : null}

      {gtmId && gaReady ? (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : null}
    </>
  );
}
