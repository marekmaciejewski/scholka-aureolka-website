# Scholka Aureolka Website

| [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=coverage)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website) | [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=bugs)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website)<br>[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=marekmaciejewski_scholka-aureolka-website&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=marekmaciejewski_scholka-aureolka-website) |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

Static React website for [Scholka Aureolka](https://scholka.urszula-gdynia.pl/), a children's choir at St. Ursula Parish in Gdynia.

The interface is intentionally parent oriented: a practical coordination hub for schedules, notices, photos, first steps, and in-person contact rather than a promotional recruitment site.

## Stack

- React, TypeScript, Vite
- Static multi-page build: `/`, `/schedule/`, `/gallery/`, `/contact/`
- GitHub Pages with a custom domain
- Google Calendar for schedule and notices
- Google Drive for gallery albums
- SonarQube Cloud, Vitest, Playwright, ESLint

## Local Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173/`.

Useful checks:

```bash
npm run build
npm run lint
npm test
npm run test:coverage
npx playwright install chromium
npm run test:e2e
```

Use `npm run preview` to serve the production build locally.

## Google Integration

Local Google config belongs in `.env.local`:

```bash
VITE_GOOGLE_API_KEY=your-restricted-browser-api-key
VITE_GOOGLE_CALENDAR_ID=your-public-calendar-id@group.calendar.google.com
VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID=your-public-gallery-folder-id
VITE_EVENT_PROGRESS_WINDOW_DAYS=7
```

The API key is public in the built frontend, so restrict it by HTTP referrer to `https://scholka.urszula-gdynia.pl/*` and local development origins such as `http://localhost:5173/*`.

Calendar events are loaded for the next 3 months. Event titles starting with `[notice]` become home-page notices and are hidden from the schedule list. Add `slug: custom-event-slug` in an event description to create a stable shareable schedule URL such as `/schedule/?event=custom-event-slug`.

Event time chips fill as progress bars before the event. `VITE_EVENT_PROGRESS_WINDOW_DAYS` controls how many days before the event the fill starts; invalid or missing values fall back to 7.

Gallery albums come from Google Drive subfolders named:

```text
YYYY-MM-DD - Polish title -- English title
```

Prefix an image filename with `[cover]` to use it as the album cover.

## Deployment

Production: [https://scholka.urszula-gdynia.pl/](https://scholka.urszula-gdynia.pl/)

Deployment is handled by `.github/workflows/pages.yml`. The workflow runs on pushes to `dev` or `master`, and can also be started manually. It builds the Vite app and deploys `dist/` to GitHub Pages.

Required GitHub settings:

- Pages source: GitHub Actions
- Secret: `VITE_GOOGLE_API_KEY`
- Variables: `VITE_GOOGLE_CALENDAR_ID`, `VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID`
- Optional variable: `VITE_EVENT_PROGRESS_WINDOW_DAYS` defaults to `7`

The current custom-domain deployment uses Vite `base: '/'`. Change that only if the site moves back to a repository path such as `/scholka-aureolka-website/`.

## SonarQube Cloud

SonarQube Cloud is configured in `sonar-project.properties` and runs from `.github/workflows/sonarqube.yml`.

Project key:

```text
marekmaciejewski_scholka-aureolka-website
```

Report: [SonarQube Cloud project](https://sonarcloud.io/summary/overall?id=marekmaciejewski_scholka-aureolka-website&branch=master)

The workflow builds, lints, runs Vitest coverage, runs Playwright tests, and then submits analysis. Keep SonarQube Cloud Automatic Analysis disabled so CI remains the only analysis source. Repository secret `SONAR_TOKEN` is required.

## Notes

- Contact stays in-person only: no forms, phone numbers, or email addresses.
- Polish is the primary language; English UI/content should stay complete.
