import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// src/lib/api.ts and src/lib/socket.ts fall back to http://localhost:3000 when these are
// missing, which silently produces a broken production bundle ("Failed to fetch").
const REQUIRED_PRODUCTION_URLS = ["VITE_API_URL", "VITE_SOCKET_URL"];

const requireProductionUrls = (): Plugin => ({
  name: "require-production-urls",
  apply: "build",
  configResolved( config ){
    if( config.mode !== "production" ) return;

    const invalid = REQUIRED_PRODUCTION_URLS.filter(( key ) => {
      const value = String(config.env[key] ?? "");
      return !value.startsWith("https://") || /localhost|127\.0\.0\.1/.test(value);
    });

    if( invalid.length ){
      const found = invalid.map(( key ) => `  ${key}=${config.env[key] ?? "(not set)"}`).join("\n");
      throw new Error(
        `Production build aborted: these variables must be public https:// URLs ` +
        `(set them in frontend/.env.production):\n${found}`
      );
    }
  },
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    requireProductionUrls()
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/js/[name]-[hash].js",
        chunkFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name ?? "";
          if( name.endsWith(".css") ){
            return "assets/css/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        manualChunks: (id) => {
          if( id.includes("node_modules") ) return "vendor";
        },
      },
    },
  },
});
