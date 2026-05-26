import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const schema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.coerce.date(),
  draft: z.boolean().optional(),
});

// Posts live at <base>/<slug>/index.{md,mdx}; strip "/index" so the entry id
// stays the directory name (preserving existing URLs).
const stripIndex = ({ entry }: { entry: string }) =>
  entry.replace(/\/index\.mdx?$/, "");

const blog = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: "./src/content/blog",
    generateId: stripIndex,
  }),
  schema,
});

const projects = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: "./src/content/projects",
    generateId: stripIndex,
  }),
  schema,
});

export const collections = { blog, projects };
