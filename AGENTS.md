# AGENTS.md

## Project

Maintain the live website for the children's Polish Christian choir "Scholka Aureolka".

Production site:

- `https://scholka.urszula-gdynia.pl/`

This is a parent-oriented UI: a practical coordination hub for schedules, notices, photos, first steps, and in-person contact. Do not steer the design toward a promotional recruitment site.

## Stack

- React
- TypeScript
- Vite
- Static multi-page output hosted on GitHub Pages
- Google Calendar for schedule and notices
- Google Drive for gallery albums
- SonarQube Cloud, Vitest, Playwright, ESLint

The current deployment uses a custom domain at the site root, so Vite's production base path must remain `/`. Do not use `/scholka-aureolka-website/` unless the site moves back to a GitHub Pages repository URL.

## Site Model

Use Vite's static multi-page app pattern. Current public pages:

- `/` - Start
- `/schedule/` - Ogarniajzer / Schedule
- `/gallery/` - Gallery
- `/contact/` - Contact

Each page has an HTML entry point and mounts the shared React app. React Router is not currently installed; keep direct links and refresh behavior simple on GitHub Pages.

Likely future sections:

- Achievements
- Songs
- Frequency

The exact scope of "frequency" is not yet defined. Ask before implementing that section.

## Language

Polish is the primary language. English translation must remain complete across public UI and content.

Avoid hard-coding Polish-only text inside reusable components. Prefer structured content and typed translation records.

## Theme and Assets

Support light and dark themes with CSS custom properties and `data-theme` on the document root.

Logo-derived palette:

- Purple: `#3C2F75`
- Violet: `#C22CC6`
- Deep violet: `#830886`
- Gold: `#FFB400`
- Dark gold: `#996C00`

Logo variants live in `public/`. Use the theme/background-appropriate variant and keep the home page logo prominent.

## Google Integration

Calendar config:

- `VITE_GOOGLE_API_KEY`
- `VITE_GOOGLE_CALENDAR_ID`

Gallery config:

- `VITE_GOOGLE_API_KEY`
- `VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID`

Event progress config:

- `VITE_EVENT_PROGRESS_WINDOW_DAYS` - optional, defaults to 7

The app fetches calendar events for the next 3 months. `[notice]` calendar events become home-page notices and are excluded from the schedule list. Gallery albums come from Drive subfolders.

Do not commit private credentials. Restrict the browser API key by HTTP referrer for production and local development.

## Contact and Privacy

Do not add contact forms, phone numbers, or email addresses.

Contact should remain in-person only, naming the responsible people and pointing visitors to scheduled choir meetings or parish links.

Parents have signed photo consents, so gallery support is allowed. Still keep child-related public content minimal and parent-approved.

## Development Checks

Local dev server:

- `http://localhost:5173/`

Useful commands:

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:coverage`
- `npm run test:e2e`

Playwright starts/reuses the Vite dev server through `playwright.config.ts`. Install Chromium locally with `npx playwright install chromium` before running e2e tests for the first time.

## Local Development Assumptions

For local UI verification, assume the Vite dev server is normally prepared at:

- `http://localhost:5173/`

The in-app Browser plugin should normally be available and may already be open.

When a task requires browser verification:

- First try to use the Browser plugin against `http://localhost:5173/`.
- If the Browser plugin is unavailable, ask the user to enable or restart it.
- If `http://localhost:5173/` is not reachable, ask the user whether to start the dev server or wait until they start it.
- Do not silently fall back to unrelated browser or search tooling for local UI verification.

## SonarQube MCP

When SonarQube MCP tools are available, use them for code-quality context instead of guessing from badges.

Resolve the project key from `sonar-project.properties`:

```text
marekmaciejewski_scholka-aureolka-website
```

Use `branch: "master"` for the long-lived branch unless the user explicitly asks for a pull request or another branch. Do not pass a git branch name as `pullRequest`; SonarQube PR keys are different.

A useful first check is `get_project_quality_gate_status` with the project key and `branch: "master"`. On 2026-06-29, that MCP check returned `OK`; treat that as a point-in-time signal and recheck when quality status matters.

## Documentation

Keep `README.md` concise and operational. Put agent-facing implementation guidance here in `AGENTS.md`.
