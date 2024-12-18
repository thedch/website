import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import react from '@astrojs/react';
import icon from "astro-icon";

// import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://dch.xyz",
  integrations: [tailwind(), sitemap(), mdx(), pagefind(), icon(), react()],
  markdown: {
    shikiConfig: {
      theme: "css-variables"
    }
  },
  output: "static",
  vite: {
    build: {
      modulePreload: {
        polyfill: false
      },
    },
  }
});
