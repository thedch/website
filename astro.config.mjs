import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export default defineConfig({
  site: "https://dch.xyz",
  integrations: [sitemap(), mdx(), icon(), react()],
  image: {
    service: { entrypoint: "astro/assets/services/compile" },
  },
  markdown: {
    // 1. Enable syntax highlighting with Shiki
    shikiConfig: {
      theme: "css-variables",
    },
    // 2. Add our remark plugins
    remarkPlugins: [
      // i. GFM footnotes (modern standard)
      remarkGfm,

      // ii. Custom transformer to add data attributes for our tooltip system
      () => {
        return (tree) => {
          const footnoteMap = {};

          // First pass: collect footnote texts
          visit(tree, "footnoteDefinition", (node) => {
            let text = "";
            node.children.forEach((child) => {
              if (child.type === "paragraph") {
                child.children.forEach((grandChild) => {
                  if (grandChild.type === "text") {
                    text += grandChild.value;
                  }
                });
              }
            });
            footnoteMap[node.identifier] = text;
          });

          // Second pass: add data attributes to footnote references
          visit(tree, "footnoteReference", (node) => {
            const footnoteText = footnoteMap[node.identifier] || "";
            node.data = node.data || {};
            node.data.hProperties = {
              "data-footnote-ref": "",
              "data-footnote-id": node.identifier,
              "data-footnote-text": footnoteText,
              class: "footnote-ref",
            };
          });

          return tree;
        };
      },
    ],
    // 3. Add rehype plugins
    rehypePlugins: [
      [
        rehypeExternalLinks,
        { target: "_blank", rel: ["noopener", "noreferrer"] },
      ],
    ],
  },
  output: "static",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Astro 6 + @astrojs/cloudflare run dev/SSR/prerender in the workerd
      // runtime, which has no CommonJS `module` global. The transitive `debug`
      // dependency (pulled via micromark and astro-icon) references
      // `module.exports` at load time, crashing every markdown/icon route with
      // "module is not defined". Alias it to an ESM (obug) shim until fixed
      // upstream. https://github.com/expressive-code/expressive-code/issues/439
      alias: {
        debug: new URL("./src/shims/debug.js", import.meta.url).pathname,
      },
    },
    build: {
      modulePreload: {
        polyfill: false,
      },
    },
  },
});
