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

/**
 * main.tsx loads the app and the simulated backend with dynamic imports (they
 * start in parallel, see there). The browser would only discover those chunks
 * after running the entry; preloading them from the HTML saves that round trip.
 */
function preloadBootChunks(): Plugin {
  const entries = [/src\/app\/render\.tsx$/, /src\/mocks\/browser\.ts$/];
  return {
    name: "kurio:preload-boot-chunks",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const bundle = context.bundle ?? {};
        const files = new Set<string>();
        const visit = (fileName: string) => {
          const chunk = bundle[fileName];
          if (chunk?.type !== "chunk" || files.has(fileName)) return;
          files.add(fileName);
          for (const imported of chunk.imports) visit(imported);
        };
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== "chunk" || chunk.isEntry) continue;
          const id = chunk.facadeModuleId?.replaceAll("\\", "/") ?? "";
          if (entries.some((entry) => entry.test(id))) visit(chunk.fileName);
        }
        // Vite already preloads the entry's static imports.
        return [...files]
          .filter((file) => !html.includes(`/${file}"`))
          .map((file) => ({
            tag: "link",
            attrs: { rel: "modulepreload", crossorigin: "", href: `/${file}` },
            injectTo: "head" as const,
          }));
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadBodyFont(), preloadBootChunks()],
  resolve: {
    alias: [
      // Mirrors `paths` in tsconfig.app.json.
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // Only MSW's cookie store uses tldts; see src/mocks/lib/tldts-lite.ts.
      {
        find: /^tldts$/,
        replacement: fileURLToPath(new URL("./src/mocks/lib/tldts-lite.ts", import.meta.url)),
      },
    ],
  },
  build: {
    rolldownOptions: {
      output: {
        // The base libraries and the app's shared code each go in one chunk,
        // instead of dozens of tiny ones that cost a round trip each on slow
        // networks. The simulated backend's libraries stay in their own chunk.
        codeSplitting: {
          groups: [
            {
              name: "vendor",
              test: /node_modules[\\/](react|react-dom|scheduler|@tanstack|@radix-ui|radix-ui|@floating-ui|axios|zod|lucide-react|sonner|zustand|cn|class-variance-authority|big\.js)[\\/]/,
            },
            { name: "shared", test: /[\\/]src[\\/]shared[\\/]/ },
          ],
        },
      },
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
