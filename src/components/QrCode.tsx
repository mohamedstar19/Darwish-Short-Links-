"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** QR code for a short link, with a PNG download */
export default function QrCode({ url, name }: { url: string; name: string }) {
  const t = useTranslations("links");
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    import("qrcode")
      .then((m) => m.default.toDataURL(url, { width: 512, margin: 2 }))
      .then((data) => alive && setSrc(data));
    return () => {
      alive = false;
    };
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-3">
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
          <img src={src} alt={t("qrAlt", { url })} className="h-44 w-44 rounded-lg bg-white p-2" />
          <a
            href={src}
            download={`qr-${name}.png`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold hover:bg-muted"
          >
            ⬇ {t("downloadQr")}
          </a>
        </>
      ) : (
        <div className="h-44 w-44 animate-pulse rounded-lg bg-muted" />
      )}
    </div>
  );
}
