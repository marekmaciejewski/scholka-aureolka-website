# AGENTS.md

## Project

Build a public website for the children's Polish Christian choir "Scholka Aureolka".

The site should feel warm, clear, parish-friendly, and practical for parents. It should avoid a marketing landing-page style and instead make the main user flows easy to scan: when rehearsals happen, where to find updates, how to view photos, and how to contact the organizer in person.

## Stack

- React
- TypeScript
- Vite
- Static output hosted on GitHub Pages

The current production deployment is a GitHub Pages project site at:

- `https://marekmaciejewski.github.io/scholka-aureolka-website/`

For this deployment, Vite's production base path must include `/scholka-aureolka-website/`; do not flag that as an issue while the site is served from that project URL.

Revisit the production base path only if the site moves to a custom domain or to a root user/organization Pages URL such as `https://marekmaciejewski.github.io/`. In that case, the production base path should become `/`.

## Site Model

Use a static multi-page site, not SPA-style client routing.

Planned sections:

- Start
- Gallery
- Calendar
- Organization
- Contact

Future sections may include:

- News
- Songs
- For parents
- FAQ

Shared navigation, footer, language switching, theme switching, and layout components should be reused across pages.

## Language

Polish is the primary language.

English translation must be complete across the public site. Avoid leaving mixed-language UI unless it is a proper name or external title.

## Theme

Support light and dark themes.

Use CSS custom properties for theme tokens and switch themes with a stable attribute such as `data-theme` on the document root.

Palette derived from the logo assets:

- Purple: `#3C2F75`
- Violet: `#C22CC6`
- Deep violet: `#830886`
- Gold: `#FFB400`
- Dark gold: `#996C00`

Do not let the site become a one-color purple theme. Use gold, neutral backgrounds, white space, and restrained contrast to keep the design readable.

## Assets

Logo variants are stored in `public/`.

Use the appropriate logo variant for each context:

- Light theme
- Dark theme
- Purple-background sections

Keep the logo visible on the home page as a first-viewport signal.

## Calendar

The calendar should be dynamic and based on a public Google Calendar.

Display upcoming events up to 3 months forward. A custom rendered calendar/list is preferred over a plain Google Calendar iframe so it can match the site theme and support both languages.

Do not commit private credentials. If a browser API key is used, it must be restricted to the production GitHub Pages domain and local development origins as needed.

## Contact

Do not add contact forms, phone numbers, or email addresses.

The contact page should say that the named organizer can be contacted in person during scheduled choir meetings and after relevant scheduled gatherings.

## Content

Placeholder or lorem ipsum content is acceptable until final copy is provided.

The parish page confirms useful schedule facts:

- Children's Mass: Sunday at 12:00 outside holiday periods
- Rehearsals: Thursday at 18:30 and Sunday at 11:00

Parents have signed photo consents, so gallery support is allowed.

## Local Development Assumptions

For local UI verification, assume the Vite dev server is normally prepared at:

- `http://localhost:5173/`

The in-app Browser plugin should normally be available and may already be open.

When a task requires browser verification:

- First try to use the Browser plugin against `http://localhost:5173/`.
- If the Browser plugin is unavailable, ask the user to enable or restart it.
- If `http://localhost:5173/` is not reachable, ask the user whether to start the dev server or wait until they start it.
- Do not silently fall back to unrelated browser or search tooling for local UI verification.

## Implementation Notes

- Keep components small and content-driven.
- Prefer structured data files for navigation, translations, calendar labels, gallery albums, and page copy.
- Avoid hard-coding Polish-only strings inside reusable components.
- Make pages responsive from the start.
- Keep GitHub Pages deployment simple: build static assets and publish the `dist/` output.
