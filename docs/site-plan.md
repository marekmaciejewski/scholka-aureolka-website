# Scholka Aureolka Site Plan

## Summary

"Scholka Aureolka" is a children's Polish Christian choir website for parents, parish visitors, and children interested in joining.

The site should be simple, welcoming, and practical. The first things a visitor should understand are:

- What Scholka Aureolka is
- When the choir meets
- Where current events and photos can be found
- How to open practical parent information from the home hero
- How to contact the organizer in person

## Confirmed Decisions

- Hosting: GitHub Pages user/organization site
- Stack: React, TypeScript, Vite
- Site type: static multi-page site, not SPA-style client routing
- Primary language: Polish
- Secondary language: English, with full translation
- Theme support: light and dark
- Contact: no forms, no phone numbers, no email addresses
- Ogarniajzer/Schedule: dynamic public Google Calendar, showing up to 3 months forward
- Gallery: allowed because photo consents are already signed by parents

## Brand Assets

Logo variants are stored in `public/`.

Use the variants according to theme and background:

- Light theme logo for bright backgrounds
- Dark theme logo for dark backgrounds
- Purple-background logo for purple hero or feature bands

The home page should show the logo prominently in the first viewport.

## Palette

Logo-derived colors:

- Purple: `#3C2F75`
- Violet: `#C22CC6`
- Deep violet: `#830886`
- Gold: `#FFB400`
- Dark gold: `#996C00`

Suggested use:

- Purple: primary brand color, headings, navigation accents
- Gold: key actions, highlights, calendar emphasis
- Violet/deep violet: secondary accents and decorative small details
- Neutral light/dark surfaces: page backgrounds, cards, text areas

Avoid making the whole interface purple. The choir identity should feel bright and joyful, but text must remain easy to read.

## Pages

### Start

Purpose: introduce the choir and show the most important schedule details.

Recommended sections:

- Hero with logo, name, short intro, and quick links
- Schedule highlights
- Short "Who we are" section
- Upcoming events preview
- Gallery preview
- Contact teaser

Initial real facts to include:

- Children's Mass: Sunday at 12:00 outside holiday periods
- Rehearsals: Thursday at 18:30 and Sunday at 11:00

### Gallery

Purpose: show choir life and events.

Recommended layout:

- Album grid
- Album cover image
- Event title
- Date
- Short caption

Future enhancement:

- Album detail page
- Lightbox
- Filtering by year or event type

### Ogarniajzer / Schedule

Purpose: show current dates, exceptions, cancellations, rehearsals, Masses, and special events.

Public URL: `/schedule/`

Recommended layout:

- Upcoming event list for the next 3 months
- Month grouping
- Event date, time, title, location, and notes

Implementation direction:

- Public Google Calendar
- Query events from now through 3 months forward
- Render in React using the site theme
- Keep an iframe fallback only if API integration is delayed

### First Steps Modal

Purpose: give parents the shortest practical checklist without adding a separate page.

The home hero secondary action should open a modal with bullet points for:

- Where to gather
- What to bring
- Toilet availability on premises
- Consent paperwork
- Outfit information
- Safeguarding

### Contact

Purpose: explain how to reach the organizer without exposing private contact data.

Recommended content:

- Organizer name
- Information that contact is available in person during scheduled choir meetings
- Facebook link
- Parish page link
- Optional address or parish location link

No form, phone number, or email address should be added.

## Language Model

Polish should be the default language.

English should be complete, not partial. A visitor who switches to English should not see Polish UI labels except for names, titles, and external source names.

Recommended implementation:

- Keep route/page structure shared.
- Keep translations in structured files.
- Store selected language in `localStorage`.
- Allow the site to fall back to Polish if an unknown language is requested.

Future language expansion note:

- The current React implementation uses a lightweight typed translation model rather than a framework-provided i18n pipeline: `Language`, `LocalizedText`, `languageOptions`, and `translate(...)`.
- Adding a third language such as Ukrainian should start by centralizing supported-language metadata, including labels, locale IDs, storage validation, and calendar language labels.
- TypeScript should continue to require complete translations for public UI strings.
- Pluralization should be revisited before adding more languages, because Polish and Ukrainian have richer plural rules than English.
- If the site grows into translator-maintained content, news, songs, FAQ, or many separate content areas, consider migrating to a dedicated React i18n library such as react-i18next, React Intl / FormatJS, or Lingui. For a small static parish site, the current typed content-file approach is still reasonable.

## Theme Model

Recommended implementation:

- Use CSS custom properties.
- Apply `data-theme="light"` or `data-theme="dark"` to the document root.
- Store selected theme in `localStorage`.
- Respect system preference on first visit.

## Navigation

Main navigation:

- Start
- Ogarniajzer
- Galeria
- Kontakt

English labels:

- Home
- Schedule
- Gallery
- Contact

Navigation should remain usable on mobile and desktop. The active page should be clearly marked.

## GitHub Pages Notes

This is planned as a user/organization GitHub Pages site.

Expected production URL:

```text
https://<owner>.github.io/
```

Vite base path should remain `/`.

If the site is moved to a project-page repository later, update the base path before deployment.

## Open Items

- Final organizer name
- Final Polish copy
- Final English copy
- Public Google Calendar ID
- Google Calendar API key strategy or iframe fallback decision
- Gallery album structure and first photo set
- GitHub Actions deployment workflow
