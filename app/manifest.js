export default function manifest() {
  return {
    name: "Tire Store 101",
    short_name: "Tire Store 101",
    description: "Internal employee training for TSSC tire and auto service.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F7F8",
    theme_color: "#F7F7F8",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
