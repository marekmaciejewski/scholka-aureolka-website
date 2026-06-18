# Scholka Aureolka Website

Static React website for the children's Polish Christian choir "Scholka Aureolka".

The site is built with React, TypeScript, and Vite, and is hosted on GitHub Pages.

## Goals

- Polish-first website with complete English translation.
- Light and dark themes using colors from the choir logo.
- Simple static page delivery with reusable React components.
- Architecture that can grow toward content-driven sections such as songs, albums, and event detail pages.
- Public pages for start, gallery, calendar, organization, and contact.
- Dynamic upcoming-events view backed by a public Google Calendar.
- No contact forms, phone numbers, or email addresses.

## Routing and Page Architecture

The current implementation uses Vite's static multi-page app pattern: `/`, `/gallery/`, `/calendar/`, `/organization/`, and `/contact/` each have an `index.html` entry point. Those pages mount the same shared React application, and React selects the visible page content from the current pathname.

React Router is not currently installed. For the present shallow public site, that is intentional: normal document URLs work naturally on GitHub Pages, refreshes and direct links are straightforward, and page-specific HTML metadata remains simple.

This is not a permanent anti-router rule. React Router would become reasonable if the site grows into nested or content-driven routes, for example:

- `/songs/` and `/songs/:songSlug`
- `/gallery/` and `/gallery/:albumSlug`
- event detail pages
- URL-driven filters or search
- route-level data loading, pending states, or error boundaries

Until that need is clear, prefer a small shared page registry and structured content collections over introducing SPA routing. That keeps the current site simple while making a future move to React Router route configuration easier.

If React Router is introduced later, direct links and refresh behavior on GitHub Pages must be handled deliberately. For public choir content, shareable URLs that work on refresh and can carry meaningful metadata should remain the priority.

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

## Code Quality

SonarQube Cloud analysis is configured with `sonar-project.properties`.

The project key is:

```text
marekmaciejewski_scholka-aureolka-website
```

The report URL is:

```text
https://sonarcloud.io/summary/overall?id=marekmaciejewski_scholka-aureolka-website&branch=master
```

The project uses SonarQube Cloud Automatic Analysis, so no GitHub Actions scan workflow or `SONAR_TOKEN` repository secret is required for now.

Local Codex MCP configuration for SonarQube belongs in `.codex/config.toml`. The `.codex/` directory is ignored because it contains a personal token.

## Deployment

This repository is intended to be deployed as a GitHub Pages user/organization site:

```text
https://marekmaciejewski.github.io/
```

Deployment is handled by GitHub Actions in `.github/workflows/pages.yml`.

For that deployment target, Vite's base path should remain `/`. If the site is temporarily hosted as a GitHub Pages project site, the production base path must be adjusted for that URL before deployment.

In the repository settings on GitHub:

1. Open **Settings** -> **Pages**.
2. Set **Build and deployment** -> **Source** to **GitHub Actions**.
3. Push to `dev`, `main`, or `master`, or run the **Deploy to GitHub Pages** workflow manually.

The workflow installs dependencies with `npm ci`, builds the static site with `npm run build`, uploads `dist/` as a Pages artifact, and deploys it to GitHub Pages. The generated `dist/` directory stays ignored in git.

If a custom domain is added later, the production base path should also remain `/`.

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
