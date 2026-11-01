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
- `/songs/` - Songs / listening materials
- `/gallery/` - Gallery
- `/frequency/` - Frequency / Attendance statistics
- `/contact/` - Contact

Each page has an HTML entry point and mounts the shared React app. React Router is not currently installed; keep direct links and refresh behavior simple on GitHub Pages.

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

Songs config:

- `VITE_GOOGLE_API_KEY`
- `VITE_GOOGLE_SONGS_SHEET_ID`

Event progress config:

- `VITE_EVENT_PROGRESS_WINDOW_DAYS` - optional, defaults to 7

The app fetches calendar events for the next 3 months. `[notice]` calendar events become home-page notices and are excluded from the schedule list. Gallery albums come from Drive subfolders. Songs come from Google Sheet tabs named `Sections` and `Songs`; the public page shows titles and listening links, not lyrics or chords.

Do not commit private credentials. Restrict the browser API key by HTTP referrer for production and local development.

## Frequency Calculations

Frequency data comes from the configured Google Sheet and is shown only as aggregate statistics.

The `Dane` metadata tab has a header row and fixed columns: A = member ID, B = join date, C = optional departure date, D = birth date. Departure dates use the same format as join dates. The previous three-column layout is not supported. Year-named attendance tabs retain their existing layout.

Rules to preserve:

- Ignore members with missing birth dates completely.
- A member missing from an attendance tab is treated as absent for that whole year.
- Duplicate date columns are separate events, even when the date is the same.
- The first Thursday event on a date is a rehearsal, the first Sunday event on a date is a Mass, and later same-day events are `other`; non-default events still count in all-event statistics.
- Age is calculated against the current/reference date.
- Evaluate member status for both the active-member count and percentage calculations at `min(selected period end, current/reference date)`. A later departure must not make the member inactive in an earlier period.
- The departure date is the last presence date and the last included membership day. A member becomes explicitly inactive on the following day, regardless of the inactivity threshold.
- Until a departure takes effect, infer activity from the latest presence up to the status date. The inactivity buffer uses the latest event in the whole sheet up to that same date, independently of the selected period start and event-type filter. A member is active when their last presence is on or after `latest global event - activeWindowMonths`; the boundary is inclusive.
- Frequency percentages are calculated over eligible events from the member join date through the departure date, both inclusive, within the selected period. Active members use the selected period's last event as their end boundary; members inactive by the inferred rule use their last presence, narrowed to the selected period when needed. Explicit departure dates provide the inclusive end boundary for departed members.

## Contact and Privacy

Do not add contact forms, phone numbers, or personal email addresses. The only public email address is the official choir address `scholka.aureolka@gmail.com`.

Contact should prioritize the official choir address and in-person conversations, naming the responsible people and pointing visitors to scheduled choir meetings or parish links.

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

Playwright starts an isolated Vite server at `http://127.0.0.1:5174/` through `playwright.config.ts`, with dummy Google configuration and mocked API responses. It must not reuse the normal development server or call live Google services. Keep configured success cases deterministic and assert that their required events, albums, and photos are present; test empty, error, and unconfigured states separately. Install Chromium locally with `npx playwright install chromium` before running e2e tests for the first time.

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
