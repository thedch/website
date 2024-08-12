import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://thedch.github.io",
  integrations: [tailwind(), sitemap(), mdx(), pagefind(), icon()],
  markdown: {
    shikiConfig: {
      theme: "css-variables"
    }
  }
});