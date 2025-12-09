Welcome! This document outlines how to work in this project and should be followed for any change in the repository.

## Project Overview

- **Framework**: [Astro](https://astro.build/) with TypeScript and TailwindCSS, deployed on Cloudflare.
- **Content**: Blog posts and projects live in `src/content` using Astro content collections. Each project/post is a directory containing `index.mdx` with frontmatter and any component files (e.g., `.tsx` files).
- **UI Components**: Reusable pieces are under `src/components` and `src/layouts`.
- **Pages**: Route files are in `src/pages`; dynamic routes follow Astro's `[param].astro` convention. API endpoints go in `src/pages/api/`.
- **Styling**: Tailwind CSS v4 is used via `@tailwindcss/vite` plugin. Configuration is done in `src/styles/global.css` using the `@theme` directive. Tailwind utilities are preferred for styling.

## Development Workflow

- Install dependencies with `npm install`.
- Run the site locally with `npm run dev`.
- Build for production (and run the main check) with `npm run build`.
- When applicable, use `npm run preview` to serve the production build locally.
- Format code with `npm run format` (or `npm run format:check` to check without modifying).
- Pre-commit hooks are configured via `.pre-commit-config.yaml` to auto-format staged files. Install with `pre-commit install`.

## Code Conventions

- Favor existing component patterns before introducing new ones.
- Keep imports tidy; unused imports should be removed. Never wrap imports in try/catch blocks.
- Prefer Tailwind utility classes for spacing, color, and typography. If you add new global styles, place them with the existing stylesheets.
- For content-driven pages, gracefully handle missing optional fields (e.g., draft flags) to avoid empty UI elements.
- Descriptions are not displayed in the UI for blog posts or projects to maintain a clean interface.

This codebase has Blog Posts and Projects. The boilerplate code to render this content should be kept in sync, unless
there is an explicit reason to diverge.

## Adding New Projects

1. Create directory: `src/content/projects/project-name/`
2. Add `index.mdx` with frontmatter (title, description, date, optional demoURL/repoURL)
3. Add any React components (`.tsx`) in the same directory
4. Import components in MDX: `import Component from "./Component.tsx"`
5. Use `client:only="react"` directive for client-side-only React components
6. Create API endpoints in `src/pages/api/` if needed (server-side with access to Cloudflare request headers)

## Testing & Verification

- At minimum, run `npm run build` before committing. Add any other checks relevant to your changes.
- Note all executed commands in your final summary.

## Documentation

- Update README or relevant docs only when your changes alter setup, workflows, or usage.
- Keep this guide up to date if repository conventions change.

Thanks for contributing! Following these guidelines helps keep the project consistent and easy to maintain.
