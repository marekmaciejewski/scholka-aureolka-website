# Scholka Aureolka Website

Static multi-page website for the children's Polish Christian choir "Scholka Aureolka".

The site is built with React, TypeScript, and Vite, and is hosted on GitHub Pages.

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

This repository currently uses the default GitHub Pages project-site URL:

```text
https://marekmaciejewski.github.io/scholka-aureolka-website/
```

Deployment is handled by GitHub Actions in `.github/workflows/pages.yml`.

The workflow sets `GITHUB_PAGES=true` during the production build. In that mode, Vite uses `/scholka-aureolka-website/` as the asset base path so the generated files work under the GitHub Pages project URL. Local development keeps Vite's base path at `/`.

In the repository settings on GitHub:

1. Open **Settings** -> **Pages**.
2. Set **Build and deployment** -> **Source** to **GitHub Actions**.
3. Push to `dev`, `main`, or `master`, or run the **Deploy to GitHub Pages** workflow manually.

The workflow installs dependencies with `npm ci`, builds the static site with `npm run build`, uploads `dist/` as a Pages artifact, and deploys it to GitHub Pages. The generated `dist/` directory stays ignored in git.

If a custom domain is added later, the production base path can return to `/`.

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
