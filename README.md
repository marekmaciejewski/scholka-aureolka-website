# Scholka Aureolka Website

Static multi-page website for the children's Polish Christian choir "Scholka Aureolka".

The site is built with React, TypeScript, and Vite, and is intended to be hosted on GitHub Pages as a user/organization site.

## Goals

- Polish-first website with complete English translation.
- Light and dark themes using colors from the choir logo.
- Static multi-page structure, not SPA-style client routing.
- Public pages for start, gallery, calendar, organization, and contact.
- Dynamic upcoming-events view backed by a public Google Calendar.
- No contact forms, phone numbers, or email addresses.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run linting:

```bash
npm run lint
```

## Deployment

This repository is intended for a GitHub Pages user/organization site, served from:

```text
https://<owner>.github.io/
```

Because the site is served from the domain root, Vite's `base` should remain `/`.

If the repository is later changed to a project page, update Vite's `base` to the repository path before deploying.

## Project Structure

- `src/main.tsx` mounts the React app.
- `src/App.tsx` is the top-level application shell.
- `src/index.css` contains global baseline styles and theme tokens.
- `public/Logo*.svg` contains the prepared logo assets.
- `docs/site-plan.md` captures the current product and layout plan.
- `AGENTS.md` gives implementation guidance for future AI/coding-agent work.

## Logo Palette

The visual palette should be derived from the prepared logo variants:

- Purple: `#3C2F75`
- Violet: `#C22CC6`
- Deep violet: `#830886`
- Gold: `#FFB400`
- Dark gold: `#996C00`

## Calendar

The planned calendar source is a public Google Calendar.

The website should display events up to 3 months forward, using a custom React view where possible. A Google Calendar iframe can be used as a temporary fallback, but it gives less control over theme, language, and layout.

Do not commit private credentials. Any browser API key should be restricted to the GitHub Pages domain and necessary local development origins.
