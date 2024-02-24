import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";
import alpinejs from "@astrojs/alpinejs";
import markdoc from "@astrojs/markdoc";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  base: SITE.base,
  integrations: [tailwind({
    applyBaseStyles: false
  }), react(), sitemap(), alpinejs(), markdoc()],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, {
      test: "Table of contents"
    }]],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true
    }
  },
  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"]
    }
  },
  scopedStyleStrategy: "where"
});