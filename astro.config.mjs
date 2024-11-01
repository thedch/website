import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import { visualizer } from 'rollup-plugin-visualizer';
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import react from '@astrojs/react';
import icon from "astro-icon";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://thedch.github.io",
  integrations: [tailwind(), sitemap(), mdx(), pagefind(), icon(), react()],
  markdown: {
    shikiConfig: {
      theme: "css-variables"
    }
  },
  output: "server",
  adapter: cloudflare(),
  vite: {
    plugins: [
      visualizer({
        open: true, // Automatically opens the report in your browser after the build
        filename: './dist/stats.html', // Path to the generated report file
      })
    ],
    build: {
      modulePreload: {
        polyfill: false
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'onnx': ['onnxruntime-web']
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['onnxruntime-web']
    },
    ssr: {
      // Exclude onnxruntime-web from SSR
      noExternal: ['onnxruntime-web']
    }
  }
});
