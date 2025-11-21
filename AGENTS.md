# Contributor Guidelines for This Repo

Welcome! This document outlines how to work in this project and should be followed for any change in the repository.

## Project Overview
- **Framework**: [Astro](https://astro.build/) with TypeScript and TailwindCSS.
- **Content**: Blog posts and other content live in `src/content` using Astro content collections.
- **UI Components**: Reusable pieces are under `src/components` and `src/layouts`.
- **Pages**: Route files are in `src/pages`; dynamic routes follow Astro's `[param].astro` convention.
- **Styling**: Tailwind utilities are preferred. Global styles and typography are configured via `tailwind.config.mjs` and `src/styles`.

## Development Workflow
- Install dependencies with `npm install`.
- Run the site locally with `npm run dev`.
- Build for production (and run the main check) with `npm run build`.
- When applicable, use `npm run preview` to serve the production build locally.

## Code Conventions
- Favor existing component patterns before introducing new ones.
- Keep imports tidy; unused imports should be removed. Never wrap imports in try/catch blocks.
- Prefer Tailwind utility classes for spacing, color, and typography. If you add new global styles, place them with the existing stylesheets.
- For content-driven pages, gracefully handle missing optional fields (e.g., draft flags, descriptions) to avoid empty UI elements.

## Testing & Verification
- At minimum, run `npm run build` before committing. Add any other checks relevant to your changes.
- Note all executed commands in your final summary.

## Documentation
- Update README or relevant docs only when your changes alter setup, workflows, or usage.
- Keep this guide up to date if repository conventions change.

Thanks for contributing! Following these guidelines helps keep the project consistent and easy to maintain.
