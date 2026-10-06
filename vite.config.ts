import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { imagetools } from "vite-imagetools";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), imagetools(), mcpPlugin(), mode === "development" && componentTagger()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // build.target : défaut de Vite 5 ('modules' = es2020 + navigateurs à modules ES) — déjà es2020, inchangé.
  build: {
    rollupOptions: {
      output: {
        // Bibliothèques stables à part : un déploiement du site ne force plus à retélécharger React ni Supabase.
        // Rollup range aussi dans le même morceau toutes leurs dépendances non attribuées (pas d'import croisé).
        manualChunks(id: string) {
          if (id.includes("commonjsHelpers")) return "vendor-react"; // aides CJS de React : avec React, pas dans le bundle du site
          if (!id.includes("node_modules")) return;
          if (/node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run[\\/]router)[\\/]/.test(id)) return "vendor-react";
          if (/node_modules[\\/](@supabase|@tanstack)[\\/]/.test(id)) return "vendor-data";
        },
      },
    },
  },
}));
