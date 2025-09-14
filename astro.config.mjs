import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from '@astrojs/react';
import icon from "astro-icon";
import remarkFootnotes from "remark-footnotes";
import { visit } from "unist-util-visit";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://dch.xyz",
  integrations: [tailwind(), sitemap(), mdx(), icon(), react()],
  markdown: {
    // 1. Enable syntax highlighting with Shiki
    shikiConfig: {
      theme: "css-variables",
    },
    // 2. Add our remark plugins
    remarkPlugins: [
      // i. Basic footnotes
      // TODO: Port over to https://github.com/remarkjs/remark-gfm instead, remark-footnotes is deprecated
      [remarkFootnotes, { inlineNotes: true }],

      // ii. Custom transformer to place footnote text into aria-label
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

          // Second pass: add styling attributes but preserve node type
          visit(tree, "footnoteReference", (node) => {
            const footnoteText = footnoteMap[node.identifier] || "";
            // Don't change the node type, just add our custom data
            node.data = {
              hProperties: {
                "data-footnote-ref": "",
                "aria-label": footnoteText,
                "class": "footnote-ref",
                "aria-describedby": "footnote-label"
              }
            };
          });

          return tree;
        };
      },
    ],
  },
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    build: {
      modulePreload: {
        polyfill: false
      },
    },
  },
});