import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * Preloads the regular (400) weight of the self-hosted font. Its file name is
 * content-hashed by the build, so the tag is injected after bundling.
 */
function preloadBodyFont(): Plugin {
  return {
    name: "kurio:preload-body-font",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, context) {
        const font = Object.keys(context.bundle ?? {}).find((fileName) =>
          /jetbrains-mono-latin-400-normal.*\.woff2$/.test(fileName),
        );
        if (!font) return [];
        return [
          {
            tag: "link",
            attrs: {
              rel: "preload",
              href: `/${font}`,
              as: "font",
              type: "font/woff2",
              crossorigin: "",
            },
            injectTo: "head",
          },
        ];
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadBodyFont()],
  resolve: {
    // Mirrors `paths` in tsconfig.app.json.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    // Pre-bundled up front: discovering it on first use makes the dev server
    // re-optimize and reload the page mid-session.
    include: ["socket.io-client"],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
