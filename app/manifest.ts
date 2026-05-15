import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Matheus Barbeiro",
    short_name: "Matheus",
    description: "Agende seu horário com Matheus Barbeiro. Experiência premium.",
    start_url: "/agendar",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#c9a227",
    orientation: "portrait-primary",
    categories: ["lifestyle", "health"],
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  }
}
