import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // These ship native binaries / use dynamic requires; keep them out of the
  // webpack bundle so server actions can load them at runtime.
  experimental: {
    serverComponentsExternalPackages: [
      "fluent-ffmpeg",
      "ffmpeg-static",
      "sharp",
    ],
  },
};

const withPWA = withPWAInit({
  dest: "public",
  // Don't let the service worker intercept local hot-reloading.
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  workboxOptions: {
    // Aggressively cache the text content (HTML pages + the search JSON),
    // but keep media on NetworkFirst with a tight cap so a decade of
    // screenshots can't flood the device's storage.
    runtimeCaching: [
      {
        urlPattern: ({ url }) => /\/media\//.test(url.pathname),
        handler: "NetworkFirst",
        options: {
          cacheName: "codex-media",
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: ({ url }) => url.pathname === "/api/search",
        handler: "StaleWhileRevalidate",
        options: { cacheName: "codex-search-index" },
      },
      {
        urlPattern: ({ request, url }) =>
          request.destination === "document" ||
          /^\/(logbook|archive|playbook|tags)(\/|$)/.test(url.pathname),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "codex-pages",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);
