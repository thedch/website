import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from '@astrojs/react';
import icon from "astro-icon";
import remarkGfm from "remark-gfm";
import rehypeExternalLinks from "rehype-external-links";
import { visit } from "unist-util-visit";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://dch.xyz",
  integrations: [sitemap(), mdx(), icon(), react()],
  image: {
    service: { entrypoint: 'astro/assets/services/noop' }
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
              "class": "footnote-ref",
            };
          });

          return tree;
        };
      },
    ],
    // 3. Add rehype plugins
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    plugins: [tailwindcss()],
    build: {
      modulePreload: {
        polyfill: false
      },
    },
    ssr: {
      // Externalize heavy client-only dependencies from server bundle
      external: [
        'onnxruntime-web',
        '@huggingface/transformers',
        'three',
        'umap-js',
      ],
    },
  },
});