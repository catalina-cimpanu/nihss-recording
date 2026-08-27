import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NIHSS Erhebung",
    short_name: "NIHSS",
    description:
      "Mobile Dokumentation von NIHSS-Untersuchungen ohne patientenidentifizierende Daten.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f8fa",
    theme_color: "#00648A",
    lang: "de",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
