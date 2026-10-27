import type { MetadataRoute } from "next";

/** Installable web app: home-screen name and icons (Android uses the maskable one) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "روابط درويش — Darwish Links",
    short_name: "روابط درويش",
    description: "اختصر روابطك الطويلة، واعمل لها QR، وتابع مين بيضغط عليها.",
    start_url: "/dashboard",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#f8f5ee",
    theme_color: "#0b5d46",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
