# Scholka Aureolka Website

| [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=coverage)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website) | [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=bugs)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website) |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

Static React website for the children's Polish Christian choir "Scholka Aureolka".

The site is built with React, TypeScript, and Vite, and is hosted on GitHub Pages.

## Goals

- Polish-first website with complete English translation.
- Light and dark themes using colors from the choir logo.
- Simple static page delivery with reusable React components.
- Architecture that can grow toward content-driven sections such as songs, albums, and event detail pages.
- Public pages for start, Ogarniajzer/Schedule, gallery, and contact.
- Dynamic upcoming-events view backed by a public Google Calendar.
- Dynamic gallery view backed by a public Google Drive folder.
- No contact forms, phone numbers, or email addresses.

## Routing and Page Architecture

The current implementation uses Vite's static multi-page app pattern: `/`, `/schedule/`, `/gallery/`, and `/contact/` each have an `index.html` entry point. The `/schedule/` URL is the public Ogarniajzer/Schedule page. Those pages mount the same shared React application, and React selects the visible page content from the current pathname.

React Router is not currently installed. For the present shallow public site, that is intentional: normal document URLs work naturally on GitHub Pages, refreshes and direct links are straightforward, and page-specific HTML metadata remains simple.

Schedule event links use query-string state on the static schedule page, for example `/schedule/?event=koncert-koled-2026`. This keeps direct links refresh-safe on GitHub Pages without requiring per-event HTML files or an SPA fallback route.

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

Run unit tests:

```bash
npm test
```

Generate the LCOV coverage report consumed by SonarQube Cloud:

```bash
npm run test:coverage
```

Install the Playwright browser once before running end-to-end tests locally:

```bash
npx playwright install chromium
```

Run the browser UI test suite:

```bash
npm run test:e2e
```

For an interactive browser run:

```bash
npm run test:e2e:headed
```

## Code Quality

SonarQube Cloud analysis is configured with `sonar-project.properties` and runs from GitHub Actions in `.github/workflows/sonarqube.yml`. The same workflow builds, lints, generates `coverage/lcov.info` with Vitest, installs Chromium for Playwright, and runs the end-to-end UI suite before analysis.

The project key is:

```text
marekmaciejewski_scholka-aureolka-website
```

The report URL is:

```text
https://sonarcloud.io/summary/overall?id=marekmaciejewski_scholka-aureolka-website&branch=master
```

The project uses CI-based SonarQube Cloud analysis. Add a repository secret named `SONAR_TOKEN`, and keep SonarQube Cloud Automatic Analysis disabled so GitHub Actions is the only analysis source.

Local Codex MCP configuration for SonarQube belongs in `.codex/config.toml`. The `.codex/` directory is ignored because it contains a personal token.

## Deployment

This repository is currently deployed as a GitHub Pages project site:

```text
https://marekmaciejewski.github.io/scholka-aureolka-website/
```

Deployment is handled by GitHub Actions in `.github/workflows/pages.yml`.

For that deployment target, the workflow sets `GITHUB_PAGES=true`, and Vite builds production assets with the `/scholka-aureolka-website/` base path. Local development still uses `/`.

That project-site base path is intentional for the current deployment and should not be treated as a configuration warning. Revisit it only when moving to a custom domain or root user/organization Pages URL, where the production base path should become `/`.

In the repository settings on GitHub:

1. Open **Settings** -> **Pages**.
2. Set **Build and deployment** -> **Source** to **GitHub Actions**.
3. Push to `dev`, `main`, or `master`, or run the **Deploy to GitHub Pages** workflow manually.

The workflow installs dependencies with `npm ci`, builds the static site with `npm run build`, uploads `dist/` as a Pages artifact, and deploys it to GitHub Pages. The generated `dist/` directory stays ignored in git.

## Project Structure

- `src/main.tsx` mounts the React app.
- `src/App.tsx` owns app-level state and selects the current static page.
- `src/pages/` contains page-level React components.
- `src/components/` contains shared layout, event, and gallery components.
- `src/core.ts` contains shared types, URL helpers, formatting, and Google API loading.
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

## Ogarniajzer / Schedule

The schedule source is a public Google Calendar when these Vite env variables are present:

```bash
VITE_GOOGLE_API_KEY=your-restricted-browser-api-key
VITE_GOOGLE_CALENDAR_ID=your-public-calendar-id@group.calendar.google.com
VITE_GOOGLE_BIRTHDAY_CALENDAR_ID=your-public-birthday-calendar-id@group.calendar.google.com
```

For local development, copy `.env.example` to `.env.local` and fill in the real values. The birthday calendar ID is optional. The schedule does not generate recurring fallback events; if Google Calendar config is missing or all configured calendar requests fail, the page shows a calendar status instead of local template events.

The site fetches events from now through 3 months forward with `singleEvents=true`, so recurring Google Calendar events are expanded into individual occurrences. When both the main calendar and birthday calendar are configured, events from both public calendars are merged and sorted together. If a Google Calendar event has a custom event color exposed as `colorId`, the site fetches the public Calendar API color palette and uses that color as the event-card accent. Events without a custom Google color use the site's default gold accent. The Ogarniajzer/Schedule page at `/schedule/` renders the events in React instead of using a Google Calendar iframe. Event cards with details can be expanded; only one event is open at a time.

Home page notices use the same public Google Calendar feed. Any event whose title starts with `[notice]` is shown only as an important notice on the home page and is excluded from the schedule event list. Multiple notice events are stacked. The visible notice title is the event title after `[notice]`; if nothing remains, the site uses a translated "Important notice" fallback. The event description becomes the notice body. The site does not cache notices, so removing the event or moving it outside the fetched 3-month window removes the notice from the next page load.

Google Calendar descriptions are rendered with a safe subset of rich formatting on both notices and schedule events: paragraphs, line breaks, lists, bold, italic, underline, strikethrough, and HTTP/HTTPS links. Event attachments are shown as attachment links when Google exposes a `fileUrl`. The site does not bypass Google Drive permissions, so attached Drive files must be shared appropriately if public visitors should be able to open them.

Notice descriptions may use optional language blocks:

```text
PL:
Próba w czwartek jest odwołana.

EN:
Thursday rehearsal is cancelled.
```

Expandable schedule events get shareable URLs. Add a metadata line to the Google Calendar description to define the public slug:

```text
slug: koncert-koled-2026
```

That line is removed from the displayed event details. The resulting public URL is `/schedule/?event=koncert-koled-2026`, and opening it expands and scrolls to the matching event when it is still inside the 3-month schedule window. Expandable event cards can copy that URL from the icon button. Expandable events without explicit metadata receive an automatic date/title fallback slug, but explicit `slug:` metadata is preferred for links that will be sent to parents.

Do not commit private credentials. Any browser API key should be restricted to the GitHub Pages domain and necessary local development origins.

For GitHub Pages, set these repository settings before deploying:

- Repository secret `VITE_GOOGLE_API_KEY`
- Repository variable `VITE_GOOGLE_CALENDAR_ID`
- Optional repository variable `VITE_GOOGLE_BIRTHDAY_CALENDAR_ID`
- Repository variable `VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID`

Google Calendar setup:

1. Create a dedicated public calendar for Scholka Aureolka events.
2. In Calendar settings, enable public availability for the calendar, then copy the Calendar ID from **Integrate calendar**.
3. Add regular rehearsals and Masses as recurring events in Google Calendar.
4. Add exceptions directly in Google Calendar: move a single occurrence, delete a skipped occurrence, or add a visible cancellation/special-event entry.
5. Put parent-facing details in the event description and location fields. If English content is required for public visitors, include bilingual details in the calendar event text.
6. In Google Cloud, enable the Google Calendar API and Google Drive API, create a browser API key, and restrict it by HTTP referrer to the production GitHub Pages origin and local development origins such as `http://localhost:5173/*`.

## Gallery

The gallery source is a public Google Drive folder when these Vite env variables are present:

```bash
VITE_GOOGLE_API_KEY=your-restricted-browser-api-key
VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID=your-public-gallery-folder-id
```

The configured Drive folder should contain one subfolder per album. Album folder names should use this convention:

```text
YYYY-MM-DD - Polish title -- English title
```

The English title is optional. If it is missing, the Polish album title is used in both languages. Put `[cover]` at the start of an image filename to choose the album cover. If no image uses that prefix, the site uses the first image returned by Drive name ordering. Photo filenames are not shown on the public site.

Birthday calendar setup:

1. The built-in Google **Birthdays** calendar is a special Google Contacts calendar. It does not expose the normal **Integrate calendar** section, and it is not readable by the site's anonymous public API-key integration.
2. For the current static GitHub Pages site, use a dedicated normal Google Calendar for birthdays.
3. Make that dedicated birthday calendar public with event details visible.
4. Copy the birthday calendar ID and add it locally as `VITE_GOOGLE_BIRTHDAY_CALENDAR_ID`.
5. Add it in GitHub as the repository variable `VITE_GOOGLE_BIRTHDAY_CALENDAR_ID`.
6. Keep birthday event text parent-approved and minimal because the site is public. Prefer first names or choir-friendly labels over full personal data.
