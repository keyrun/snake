"use client";

import Script from "next/script";
import { useState } from "react";

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
 */
export function Analytics({ gaId, gtmId }: AnalyticsProps) {
  // If there is no GA to wait for, GTM is free to load immediately.
  const [gaReady, setGaReady] = useState<boolean>(!gaId);

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
gtag('config', '${gaId}');`}
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
