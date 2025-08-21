import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LayoverHQ - Transform Your Layovers Into Adventures",
    short_name: "LayoverHQ",
    description:
      "Discover amazing layover experiences, city tours, and flight connections. Turn your travel time into exploration time.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#164e63",
    orientation: "portrait",
    categories: ["travel", "lifestyle", "navigation"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Search Flights",
        short_name: "Search",
        description: "Find layover-optimized flights",
        url: "/search",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "My Trips",
        short_name: "Trips",
        description: "View your upcoming layover adventures",
        url: "/dashboard",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  }
}
