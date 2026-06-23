import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  albums,
  calendarEventHighlightText,
  commonText,
  contactDetails,
  defaultLanguage,
  footerCredits,
  footerQuote,
  homeHeroCta,
  homeHeroText,
  homeImportantNotice,
  languageOptions,
  logoPaths,
  navigationItems,
  pageIntro,
  firstStepsModal,
  scheduleCards,
  scheduleText,
  type Language,
  type LocalizedText,
  type PageKey,
  type ThemeName,
} from './siteContent'

type EventSource = 'google-calendar' | 'birthday-calendar'

type UpcomingEvent = {
  id: string
  date: Date
  endDate?: Date
  title: string
  location?: string
  note?: string
  slug?: string
  isAllDay?: boolean
  source: EventSource
  eventColor?: CalendarEventColor
  eventHighlight?: EventHighlight
}

type CalendarLoadStatus = 'unconfigured' | 'loading' | 'ready' | 'error'

type CalendarState = {
  status: CalendarLoadStatus
  events: UpcomingEvent[]
}

type GoogleCalendarEventDate = {
  date?: string
  dateTime?: string
  timeZone?: string
}

type GoogleCalendarEvent = {
  id?: string
  iCalUID?: string
  summary?: string
  location?: string
  description?: string
  colorId?: string
  status?: string
  start?: GoogleCalendarEventDate
  end?: GoogleCalendarEventDate
}

type GoogleCalendarResponse = {
  items?: GoogleCalendarEvent[]
  error?: {
    message?: string
  }
}

type GoogleCalendarColor = {
  background?: string
  foreground?: string
}

type GoogleCalendarColorsResponse = {
  event?: Record<string, GoogleCalendarColor>
  error?: {
    message?: string
  }
}

type CalendarEventColor = {
  background: string
  foreground?: string
}

type CalendarEventColorMap = Record<string, CalendarEventColor>

type EventHighlightKind = 'birthday' | 'important'

type EventHighlight = {
  kind: EventHighlightKind
  accent?: string
}

type EventCardStyle = CSSProperties & {
  '--event-accent'?: string
}

type GoogleCalendarConfig = {
  apiKey: string
  calendars: Array<{
    calendarId: string
    source: EventSource
  }>
}

const languageStorageKey = 'scholka-aureolka-language'
const themeStorageKey = 'scholka-aureolka-theme'
const eventSlugSearchParam = 'event'
const homeScheduleCards = scheduleCards.slice(0, 2)
const childrenMassCard = scheduleCards[2]
const birthdayEventAccent = 'var(--color-violet)'
const importantEventAccent = 'var(--color-important)'

const languageLocale: Record<Language, string> = {
  pl: 'pl-PL',
  en: 'en-US',
}

function getBasePath() {
  return import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
}

function withBasePath(path: string) {
  if (path.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(path)) {
    return path
  }

  return `${getBasePath()}${path.replace(/^\/+/, '')}`
}

function getScheduleEventHref(slug: string) {
  return withBasePath(`/schedule/?${eventSlugSearchParam}=${encodeURIComponent(slug)}`)
}

function isExpandableScheduleEvent(event: UpcomingEvent) {
  return event.eventHighlight?.kind !== 'birthday' && Boolean(event.note)
}

function getHomeEventHref(event: UpcomingEvent) {
  if (isExpandableScheduleEvent(event) && event.slug) {
    return getScheduleEventHref(event.slug)
  }

  return withBasePath('/schedule/')
}

function getAbsoluteScheduleEventHref(slug: string) {
  return new URL(getScheduleEventHref(slug), window.location.origin).href
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  document.body.append(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
  } finally {
    textArea.remove()
  }
}

function removeBasePath(pathname: string) {
  const basePath = new URL(getBasePath(), window.location.origin).pathname

  if (basePath !== '/' && pathname.startsWith(basePath)) {
    return `/${pathname.slice(basePath.length)}`
  }

  return pathname
}

function translate(text: LocalizedText, language: Language) {
  return text[language]
}

function translateOptional(text: LocalizedText | string, language: Language) {
  return typeof text === 'string' ? text : translate(text, language)
}

function getGoogleCalendarConfig(): GoogleCalendarConfig | null {
  const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID?.trim()
  const birthdayCalendarId = import.meta.env.VITE_GOOGLE_BIRTHDAY_CALENDAR_ID?.trim()
  const apiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY?.trim()
  const calendars: GoogleCalendarConfig['calendars'] = []

  if (calendarId) {
    calendars.push({
      calendarId,
      source: 'google-calendar',
    })
  }

  if (birthdayCalendarId) {
    calendars.push({
      calendarId: birthdayCalendarId,
      source: 'birthday-calendar',
    })
  }

  if (!apiKey || calendars.length === 0) {
    return null
  }

  return { apiKey, calendars }
}

function getInitialLanguage(): Language {
  const storedLanguage = window.localStorage.getItem(languageStorageKey)

  if (storedLanguage === 'pl' || storedLanguage === 'en') {
    return storedLanguage
  }

  return defaultLanguage
}

function getInitialTheme(): ThemeName {
  const storedTheme = window.localStorage.getItem(themeStorageKey)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getPageFromPath(pathname: string): PageKey {
  const path = removeBasePath(pathname).replace(/\/+$/, '') || '/'

  if (path === '/gallery') {
    return 'gallery'
  }

  if (path === '/schedule') {
    return 'schedule'
  }

  if (path === '/contact') {
    return 'contact'
  }

  return 'home'
}

function getLogoForTheme(theme: ThemeName, surface: 'header' | 'purple') {
  if (surface === 'purple') {
    return theme === 'dark' ? logoPaths.darkPurple : logoPaths.lightPurple
  }

  return theme === 'dark' ? logoPaths.darkHeader : logoPaths.lightHeader
}

function formatEventDate(date: Date, language: Language) {
  return new Intl.DateTimeFormat(languageLocale[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function formatEventTime(date: Date, language: Language) {
  return new Intl.DateTimeFormat(languageLocale[language], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMonth(date: Date, language: Language) {
  return new Intl.DateTimeFormat(languageLocale[language], {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatEventSlugDateTime(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    `${pad(date.getHours())}${pad(date.getMinutes())}`,
  ].join('-')
}

function createEventSlug(value: string) {
  const slug = value
    .replace(/[łŁ]/g, 'l')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 96)
    .replace(/-+$/g, '')

  return slug || undefined
}

function createFallbackEventSlug(title: string, date: Date) {
  return createEventSlug(`${formatEventSlugDateTime(date)}-${title}`)
}

function getEventSlugFromLocation() {
  const slug = new URLSearchParams(window.location.search).get(eventSlugSearchParam)

  return slug ? createEventSlug(slug) ?? null : null
}

function replaceScheduleEventUrl(slug: string | null) {
  const url = new URL(window.location.href)

  if (slug) {
    url.pathname = new URL(withBasePath('/schedule/'), window.location.origin).pathname
    url.searchParams.set(eventSlugSearchParam, slug)
  } else {
    url.searchParams.delete(eventSlugSearchParam)
  }

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function getEventDomId(event: UpcomingEvent) {
  return `event-${(event.slug ?? event.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

function parseGoogleDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function parseGoogleEventDate(value?: GoogleCalendarEventDate) {
  if (!value) {
    return null
  }

  if (value.dateTime) {
    return {
      date: new Date(value.dateTime),
      isAllDay: false,
    }
  }

  if (value.date) {
    const date = parseGoogleDateOnly(value.date)

    if (!date) {
      return null
    }

    return {
      date,
      isAllDay: true,
    }
  }

  return null
}

function normalizeCalendarText(value?: string) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return ''
  }

  if (!trimmedValue.includes('<')) {
    return trimmedValue
  }

  const parsedDocument = new DOMParser().parseFromString(trimmedValue, 'text/html')
  parsedDocument.body.querySelectorAll('br').forEach((breakElement) => {
    breakElement.replaceWith('\n')
  })
  parsedDocument.body.querySelectorAll('div, li, p').forEach((blockElement) => {
    blockElement.append('\n')
  })

  return (parsedDocument.body.textContent ?? trimmedValue)
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractCalendarNoteMetadata(note: string) {
  let slug: string | undefined
  const visibleLines = note.split(/\r?\n/).filter((line) => {
    const slugLine = line.match(/^\s*(?:slug|event-slug)\s*:\s*(.+?)\s*$/i)

    if (!slugLine) {
      return true
    }

    slug = slug ?? createEventSlug(slugLine[1])
    return false
  })

  return {
    note: visibleLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    slug,
  }
}

function normalizeEventSearchText(value: string) {
  return value.toLocaleLowerCase('pl-PL')
}

function includesEventKeyword(value: string, keywords: string[]) {
  const normalizedValue = normalizeEventSearchText(value)
  return keywords.some((keyword) => normalizedValue.includes(keyword))
}

function getCalendarEventHighlight(title: string, source: EventSource): EventHighlight | undefined {
  if (
    source === 'birthday-calendar' ||
    includesEventKeyword(title, ['urodziny', 'birthday'])
  ) {
    return {
      kind: 'birthday',
      accent: birthdayEventAccent,
    }
  }

  if (title.includes('!')) {
    return {
      kind: 'important',
      accent: importantEventAccent,
    }
  }

  return undefined
}

function getDisplayCalendarEventTitle(
  title: string,
  eventHighlight: EventHighlight | undefined,
  language: Language,
) {
  if (eventHighlight?.kind === 'birthday') {
    return translate(calendarEventHighlightText.birthday, language)
  }

  if (eventHighlight?.kind === 'important') {
    return title.replace(/!/g, '').replace(/\s{2,}/g, ' ').trim() || title
  }

  return title.trim() || title
}

function isValidHexColor(value?: string): value is string {
  return /^#[\da-f]{6}$/i.test(value ?? '')
}

function getValidCalendarEventColor(color?: GoogleCalendarColor): CalendarEventColor | undefined {
  const background = color?.background

  if (!isValidHexColor(background)) {
    return undefined
  }

  const foreground = color?.foreground

  return {
    background,
    foreground: isValidHexColor(foreground) ? foreground : undefined,
  }
}

function mapGoogleCalendarEvent(
  event: GoogleCalendarEvent,
  index: number,
  language: Language,
  source: EventSource,
  calendarId: string,
  eventColors: CalendarEventColorMap,
): UpcomingEvent | null {
  if (event.status === 'cancelled') {
    return null
  }

  const start = parseGoogleEventDate(event.start)

  if (!start) {
    return null
  }

  const end = parseGoogleEventDate(event.end)
  const rawTitle =
    normalizeCalendarText(event.summary) || translate(scheduleText.untitledEvent, language)
  const eventHighlight = getCalendarEventHighlight(rawTitle, source)
  const title = getDisplayCalendarEventTitle(rawTitle, eventHighlight, language)
  const location = normalizeCalendarText(event.location)
  const noteMetadata = extractCalendarNoteMetadata(normalizeCalendarText(event.description))
  const canCreateExpandableSlug =
    eventHighlight?.kind !== 'birthday' && Boolean(noteMetadata.note)
  const slug =
    noteMetadata.slug ??
    (canCreateExpandableSlug
      ? createFallbackEventSlug(rawTitle, start.date)
      : undefined)

  return {
    id: `${calendarId}-${event.id ?? event.iCalUID ?? `${start.date.toISOString()}-${index}`}`,
    date: start.date,
    endDate: end?.date,
    title,
    location: location || undefined,
    note: noteMetadata.note || undefined,
    slug,
    isAllDay: start.isAllDay,
    source,
    eventColor: event.colorId ? eventColors[event.colorId] : undefined,
    eventHighlight,
  }
}

async function fetchGoogleCalendarColors(apiKey: string): Promise<CalendarEventColorMap> {
  const url = new URL('https://www.googleapis.com/calendar/v3/colors')
  url.searchParams.set('key', apiKey)

  const response = await fetch(url)
  const data = (await response.json()) as GoogleCalendarColorsResponse

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Google Calendar colors request failed')
  }

  return Object.fromEntries(
    Object.entries(data.event ?? {})
      .map(([colorId, color]) => [colorId, getValidCalendarEventColor(color)] as const)
      .filter((entry): entry is readonly [string, CalendarEventColor] => entry[1] !== undefined),
  )
}

async function fetchGoogleCalendarEvents(
  calendar: GoogleCalendarConfig['calendars'][number],
  apiKey: string,
  language: Language,
  eventColors: CalendarEventColorMap,
): Promise<UpcomingEvent[]> {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 3)

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendarId)}/events`,
  )
  url.searchParams.set('key', apiKey)
  url.searchParams.set('timeMin', now.toISOString())
  url.searchParams.set('timeMax', endDate.toISOString())
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('showDeleted', 'false')
  url.searchParams.set('maxResults', '250')

  const response = await fetch(url)
  const data = (await response.json()) as GoogleCalendarResponse

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Google Calendar request failed')
  }

  return (data.items ?? [])
    .map((event, index) =>
      mapGoogleCalendarEvent(
        event,
        index,
        language,
        calendar.source,
        calendar.calendarId,
        eventColors,
      ),
    )
    .filter((event): event is UpcomingEvent => event !== null)
    .sort((first, second) => first.date.getTime() - second.date.getTime())
}

async function fetchConfiguredCalendarEvents(
  config: GoogleCalendarConfig,
  language: Language,
): Promise<UpcomingEvent[]> {
  const eventColors = await fetchGoogleCalendarColors(config.apiKey).catch(() => ({}))
  const calendarResults = await Promise.allSettled(
    config.calendars.map((calendar) =>
      fetchGoogleCalendarEvents(calendar, config.apiKey, language, eventColors),
    ),
  )
  const successfulEvents = calendarResults.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  )

  if (successfulEvents.length === 0 && calendarResults.some((result) => result.status === 'rejected')) {
    throw new Error('Google Calendar requests failed')
  }

  return successfulEvents.sort((first, second) => first.date.getTime() - second.date.getTime())
}

function getEventCardStyle(event: UpcomingEvent): EventCardStyle | undefined {
  const accent = event.eventHighlight?.accent ?? event.eventColor?.background

  if (!accent) {
    return undefined
  }

  return {
    '--event-accent': accent,
  }
}

function groupEventsByMonth(events: UpcomingEvent[], language: Language) {
  const groups = new Map<string, UpcomingEvent[]>()

  events.forEach((event) => {
    const month = formatMonth(event.date, language)
    const monthEvents = groups.get(month) ?? []
    monthEvents.push(event)
    groups.set(month, monthEvents)
  })

  return Array.from(groups.entries()).map(([month, monthEvents]) => ({
    month,
    events: monthEvents,
  }))
}

function Header({
  activePage,
  language,
  setLanguage,
  theme,
  setTheme,
}: {
  activePage: PageKey
  language: Language
  setLanguage: (language: Language) => void
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className={isMenuOpen ? 'site-header is-menu-open' : 'site-header'}>
      <div className="content-width header-inner">
        <a className="brand-link" href={withBasePath('/')} aria-label="Scholka Aureolka">
          <img className="brand-logo" src={withBasePath(getLogoForTheme(theme, 'header'))} alt="" />
          <span>
            <strong>Scholka Aureolka</strong>
            <small>{translate(commonText.siteKicker, language)}</small>
          </span>
        </a>

        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          aria-label={translate(isMenuOpen ? commonText.closeMenu : commonText.openMenu, language)}
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
        >
          <span className="menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav id="site-menu" className="main-nav" aria-label={translate(commonText.mainNavigation, language)}>
          {navigationItems.map((item) => (
            <a
              key={item.key}
              className="nav-link"
              href={withBasePath(item.href)}
              aria-current={activePage === item.key ? 'page' : undefined}
            >
              {translate(item.label, language)}
            </a>
          ))}
        </nav>

        <div className="header-controls" aria-label={translate(commonText.sitePreferences, language)}>
          <div className="segmented-control" aria-label={translate(commonText.languageLabel, language)}>
            {languageOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className="segment-button"
                aria-pressed={language === option.key}
                onClick={() => setLanguage(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="theme-switch">
            <span className="visually-hidden">{translate(commonText.darkThemeToggle, language)}</span>
            <input
              type="checkbox"
              role="switch"
              checked={theme === 'dark'}
              onChange={(event) => setTheme(event.currentTarget.checked ? 'dark' : 'light')}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb">
                <img src={withBasePath(getLogoForTheme(theme, 'purple'))} alt="" />
              </span>
            </span>
          </label>
        </div>
      </div>
    </header>
  )
}

function PageHeading({ page, language }: { page: PageKey; language: Language }) {
  const intro = pageIntro[page]

  return (
    <section className="page-heading">
      <div className="content-width narrow">
        <p className="eyebrow">{translate(intro.eyebrow, language)}</p>
        <h1>{translate(intro.title, language)}</h1>
        <p>{translate(intro.lead, language)}</p>
      </div>
    </section>
  )
}

function HeroScheduleRibbon({ language }: { language: Language }) {
  return (
    <div className="hero-schedule-ribbon" aria-label={translate(commonText.schedule, language)}>
      <div className="hero-ribbon-line">
        <span>{translate(homeHeroText.rehearsalsLabel, language)}</span>
        <strong>
          {homeScheduleCards.map((card) => translate(card.time, language)).join(' / ')}
        </strong>
      </div>
      <div className="hero-ribbon-line">
        <span>{translate(homeHeroText.massLabel, language)}</span>
        <strong>{translate(childrenMassCard.time, language)}</strong>
      </div>
    </div>
  )
}

function CopyLinkIcon({ isCopied }: { isCopied: boolean }) {
  return (
    <svg
      className="event-action-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {isCopied ? (
        <path d="m5 12 4 4L19 6" />
      ) : (
        <>
          <path d="M10.5 13.5 13.5 10.5" />
          <path d="M8.5 16.5 7.25 17.75a4 4 0 0 1-5.66-5.66l2.12-2.12a4 4 0 0 1 5.66 0" />
          <path d="m15.5 7.5 1.25-1.25a4 4 0 0 1 5.66 5.66l-2.12 2.12a4 4 0 0 1-5.66 0" />
        </>
      )}
    </svg>
  )
}

function EventList({
  events,
  language,
  compact = false,
  expandable = false,
  showDetailSymbols = expandable,
  expandedEventId = null,
  linkedEventId = null,
  copiedEventId = null,
  getEventHref,
  onExpandedEventChange,
  onEventLinkCopy,
}: {
  events: UpcomingEvent[]
  language: Language
  compact?: boolean
  expandable?: boolean
  showDetailSymbols?: boolean
  expandedEventId?: string | null
  linkedEventId?: string | null
  copiedEventId?: string | null
  getEventHref?: (event: UpcomingEvent) => string
  onExpandedEventChange?: (eventId: string | null) => void
  onEventLinkCopy?: (event: UpcomingEvent) => void
}) {
  return (
    <div className={compact ? 'event-list compact' : 'event-list'}>
      {events.map((event) => {
        const eventHighlight = event.eventHighlight
        const isBirthdayEvent = eventHighlight?.kind === 'birthday'
        const isImportantEvent = eventHighlight?.kind === 'important'
        const hasEventDetails = isExpandableScheduleEvent(event)
        const canExpandEvent = expandable && hasEventDetails
        const shouldShowDetailSymbol = showDetailSymbols && hasEventDetails
        const isExpanded = canExpandEvent && expandedEventId === event.id
        const isLinked = linkedEventId === event.id
        const detailsId = `event-details-${event.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
        const canCopyEventLink = canExpandEvent && Boolean(event.slug)
        const isCopied = copiedEventId === event.id
        const eventHref = getEventHref?.(event)
        const eventCardClassName = [
          'event-card',
          eventHref ? 'event-card-link' : '',
          isBirthdayEvent ? 'event-card--birthday' : '',
          isImportantEvent ? 'event-card--important' : '',
          shouldShowDetailSymbol ? 'has-details' : '',
          isExpanded ? 'is-expanded' : '',
          isLinked ? 'is-linked' : '',
        ]
          .filter(Boolean)
          .join(' ')

        function toggleEvent() {
          if (!canExpandEvent || !onExpandedEventChange) {
            return
          }

          onExpandedEventChange(isExpanded ? null : event.id)
        }

        function handleEventKeyDown(keyboardEvent: ReactKeyboardEvent<HTMLElement>) {
          if (keyboardEvent.target !== keyboardEvent.currentTarget) {
            return
          }

          if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
            return
          }

          keyboardEvent.preventDefault()
          toggleEvent()
        }

        function handleCopyEventLink(mouseEvent: ReactMouseEvent<HTMLButtonElement>) {
          mouseEvent.stopPropagation()

          if (!canCopyEventLink || !onEventLinkCopy) {
            return
          }

          onEventLinkCopy(event)
        }

        const eventCardContent = (
          <>
            <div className="event-card-summary">
              <div className="event-date">
                <strong>{formatEventDate(event.date, language)}</strong>
                <span>
                  {event.isAllDay
                    ? translate(scheduleText.allDay, language)
                    : formatEventTime(event.date, language)}
                </span>
              </div>
              <div className="event-body">
                <div className="event-title-row">
                  <h3>{event.title}</h3>
                  <div className="event-title-actions">
                    {isBirthdayEvent && (
                      <span
                        className="event-birthday-cake"
                        role="img"
                        aria-label={translate(calendarEventHighlightText.birthday, language)}
                      >
                        {'\uD83C\uDF82'}
                      </span>
                    )}
                    {canCopyEventLink && (
                      <button
                        type="button"
                        className={
                          isCopied
                            ? 'event-action-button event-copy-link-button is-copied'
                            : 'event-action-button event-copy-link-button'
                        }
                        aria-label={`${translate(
                          isCopied ? scheduleText.eventLinkCopied : scheduleText.copyEventLink,
                          language,
                        )}: ${event.title}`}
                        onClick={handleCopyEventLink}
                      >
                        <CopyLinkIcon isCopied={isCopied} />
                      </button>
                    )}
                    {shouldShowDetailSymbol && (
                      <span
                        className="event-expand-status-icon"
                        aria-label={translate(scheduleText.eventInfoLabel, language)}
                      >
                        {isExpanded ? '-' : '+'}
                      </span>
                    )}
                  </div>
                </div>
                {event.location && <p className="muted">{event.location}</p>}
                {!compact && !expandable && event.note && <p>{event.note}</p>}
              </div>
            </div>

            {canExpandEvent && isExpanded && (
              <div className="event-details" id={detailsId}>
                {event.location && (
                  <dl className="event-detail-list">
                    <div>
                      <dt>{translate(scheduleText.whereLabel, language)}</dt>
                      <dd>{event.location}</dd>
                    </div>
                  </dl>
                )}
                {event.note && <p className="event-detail-note">{event.note}</p>}
              </div>
            )}
          </>
        )

        if (eventHref) {
          return (
            <a
              className={eventCardClassName}
              key={event.id}
              id={getEventDomId(event)}
              href={eventHref}
              style={getEventCardStyle(event)}
            >
              {eventCardContent}
            </a>
          )
        }

        return (
          <article
            className={eventCardClassName}
            key={event.id}
            id={getEventDomId(event)}
            style={getEventCardStyle(event)}
            role={canExpandEvent ? 'button' : undefined}
            tabIndex={canExpandEvent ? 0 : undefined}
            aria-expanded={canExpandEvent ? isExpanded : undefined}
            aria-controls={canExpandEvent ? detailsId : undefined}
            aria-label={
              canExpandEvent
                ? `${translate(
                    isExpanded ? scheduleText.collapseEvent : scheduleText.expandEvent,
                    language,
                  )}: ${event.title}`
                : undefined
            }
            onClick={canExpandEvent ? toggleEvent : undefined}
            onKeyDown={canExpandEvent ? handleEventKeyDown : undefined}
          >
            {eventCardContent}
          </article>
        )
      })}
    </div>
  )
}

function ImportantNotice({ language }: { language: Language }) {
  if (!homeImportantNotice.isActive) {
    return null
  }

  return (
    <aside className="important-notice" role="status">
      <strong>{translate(homeImportantNotice.title, language)}</strong>
      <span>{translate(homeImportantNotice.body, language)}</span>
    </aside>
  )
}

function AlbumGrid({ language }: { language: Language }) {
  return (
    <div className="card-grid album-grid">
      {albums.map((album) => (
        <article className="album-card" key={translate(album.title, language)}>
          <div className={`album-cover ${album.tone}`}>
            <img src={withBasePath(getLogoForTheme('light', 'purple'))} alt="" />
          </div>
          <div className="album-body">
            <p className="eyebrow">{translate(album.date, language)}</p>
            <h3>{translate(album.title, language)}</h3>
            <p>{translate(album.caption, language)}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function FirstStepsModal({
  language,
  onClose,
}: {
  language: Language
  onClose: () => void
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="parent-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-steps-title"
      >
        <button
          type="button"
          className="modal-close"
          aria-label={translate(commonText.closeModal, language)}
          onClick={onClose}
          autoFocus
        >
          X
        </button>
        <div className="modal-heading">
          <h2 id="first-steps-title">{translate(firstStepsModal.title, language)}</h2>
        </div>
        <ul className="parent-info-list">
          {firstStepsModal.items.map((item) => (
            <li key={translate(item.title, language)}>
              <strong>{translate(item.title, language)}</strong>
              {item.body && <span>{translate(item.body, language)}</span>}
              {item.note && <em className="parent-info-note">{translate(item.note, language)}</em>}
              {item.bodyLink && (
                <span>
                  {translate(item.bodyLink.prefix, language)}
                  <a
                    className="parent-info-inline-link"
                    href={withBasePath(item.bodyLink.href)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {translate(item.bodyLink.label, language)}
                  </a>
                  {item.bodyLink.suffix && translate(item.bodyLink.suffix, language)}
                </span>
              )}
              {item.details && (
                <div className="parent-info-detail-list">
                  {item.details.map((detail) => (
                    <div className="parent-info-detail" key={translate(detail.title, language)}>
                      <b>{translate(detail.title, language)}</b>
                      <span>{translate(detail.body, language)}</span>
                    </div>
                  ))}
                </div>
              )}
              {item.link && (
                <a
                  className={
                    item.link.tone === 'strong'
                      ? 'parent-info-link strong'
                      : 'parent-info-link'
                  }
                  href={withBasePath(item.link.href)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {translate(item.link.label, language)}
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function HomePage({
  language,
  theme,
  upcomingEvents,
}: {
  language: Language
  theme: ThemeName
  upcomingEvents: UpcomingEvent[]
}) {
  const [isFirstStepsOpen, setIsFirstStepsOpen] = useState(false)

  return (
    <>
      <section className="hero-band">
        <div className="content-width hero-layout">
          <div className="hero-copy">
            <h1>Scholka Aureolka</h1>
            <p className="hero-description">{translate(homeHeroText.description, language)}</p>

            <div className="hero-info-block">
              <HeroScheduleRibbon language={language} />

              <div className="hero-actions" aria-label={translate(commonText.quickLinks, language)}>
                <a className="button primary" href={withBasePath(homeHeroCta.schedule.href)}>
                  {translate(homeHeroCta.schedule.label, language)}
                </a>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setIsFirstStepsOpen(true)}
                >
                  {translate(homeHeroCta.firstSteps.label, language)}
                </button>
              </div>
            </div>
          </div>
          <img
            className="hero-logo-mark"
            src={withBasePath(getLogoForTheme(theme, 'purple'))}
            alt=""
            aria-hidden="true"
          />
        </div>
      </section>

      <section
        className="content-section section-muted home-upcoming-section"
        aria-label={translate(commonText.upcoming, language)}
      >
        <div className="content-width home-upcoming-inner">
          <ImportantNotice language={language} />
          <EventList
            events={upcomingEvents.slice(0, 4)}
            language={language}
            compact
            getEventHref={getHomeEventHref}
            showDetailSymbols
          />
        </div>
      </section>
      {isFirstStepsOpen && (
        <FirstStepsModal language={language} onClose={() => setIsFirstStepsOpen(false)} />
      )}
    </>
  )
}

function GalleryPage({ language }: { language: Language }) {
  return (
    <>
      <PageHeading page="gallery" language={language} />
      <section className="content-section">
        <div className="content-width">
          <AlbumGrid language={language} />
        </div>
      </section>
    </>
  )
}

function SchedulePage({
  language,
  upcomingEvents,
  calendarStatus,
}: {
  language: Language
  upcomingEvents: UpcomingEvent[]
  calendarStatus: CalendarLoadStatus
}) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [linkedEventSlug, setLinkedEventSlug] = useState<string | null>(getEventSlugFromLocation)
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null)
  const groupedEvents = groupEventsByMonth(upcomingEvents, language)
  const linkedEvent = linkedEventSlug
    ? upcomingEvents.find((event) => event.slug === linkedEventSlug)
    : undefined
  const stateExpandedEventId = upcomingEvents.some((event) => event.id === expandedEventId)
    ? expandedEventId
    : null
  const linkedExpandedEventId =
    linkedEvent?.note && linkedEvent.eventHighlight?.kind !== 'birthday' ? linkedEvent.id : null
  const activeExpandedEventId = linkedExpandedEventId ?? stateExpandedEventId
  const linkedEventId = linkedEvent?.id ?? null

  const statusMessage =
    calendarStatus === 'loading'
      ? scheduleText.loading
      : calendarStatus === 'error'
        ? scheduleText.errorNotice
        : calendarStatus === 'unconfigured'
          ? scheduleText.notConfiguredNotice
          : null
  const shouldShowEmptyState = calendarStatus === 'ready' && upcomingEvents.length === 0
  const shouldShowMissingLinkedEvent =
    calendarStatus === 'ready' && Boolean(linkedEventSlug) && !linkedEvent

  function handleExpandedEventChange(eventId: string | null) {
    setExpandedEventId(eventId)

    if (linkedEventSlug) {
      setLinkedEventSlug(null)
      replaceScheduleEventUrl(null)
    }
  }

  function copyEventLink(event: UpcomingEvent) {
    if (!event.slug) {
      return
    }

    copyTextToClipboard(getAbsoluteScheduleEventHref(event.slug))
      .then(() => setCopiedEventId(event.id))
      .catch(() => setCopiedEventId(null))
  }

  useEffect(() => {
    function handlePopState() {
      setLinkedEventSlug(getEventSlugFromLocation())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!linkedEvent) {
      return
    }

    const scrollTimeout = window.setTimeout(() => {
      document
        .getElementById(getEventDomId(linkedEvent))
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 0)

    return () => {
      window.clearTimeout(scrollTimeout)
    }
  }, [linkedEvent])

  return (
    <>
      <PageHeading page="schedule" language={language} />
      <section className="content-section">
        <div className="content-width narrow month-list">
          {statusMessage && (
            <p className={`schedule-status ${calendarStatus}`} role="status">
              {translate(statusMessage, language)}
            </p>
          )}

          {shouldShowMissingLinkedEvent && (
            <p className="schedule-status warning" role="status">
              {translate(scheduleText.eventLinkNotFound, language)}
            </p>
          )}

          {shouldShowEmptyState ? (
            <p className="schedule-empty">{translate(scheduleText.emptyState, language)}</p>
          ) : upcomingEvents.length > 0 ? (
            groupedEvents.map((group, index) => {
              const headingId = `month-${index}`

              return (
                <section className="month-group" key={group.month} aria-labelledby={headingId}>
                  <h2 id={headingId}>{group.month}</h2>
                  <EventList
                    events={group.events}
                    language={language}
                    expandable
                    expandedEventId={activeExpandedEventId}
                    linkedEventId={linkedEventId}
                    copiedEventId={copiedEventId}
                    onExpandedEventChange={handleExpandedEventChange}
                    onEventLinkCopy={copyEventLink}
                  />
                </section>
              )
            })
          ) : null}
        </div>
      </section>
    </>
  )
}

function ContactPage({ language }: { language: Language }) {
  return (
    <>
      <PageHeading page="contact" language={language} />
      <section className="content-section">
        <div className="content-width contact-layout">
          <div className="contact-copy">
            <div className="contact-people">
              {contactDetails.people.map((person, index) => {
                const HeadingTag = index === 0 ? 'h2' : 'h3'

                return (
                  <section className="contact-person" key={translateOptional(person.name, defaultLanguage)}>
                    <p className="eyebrow">{translate(person.role, language)}</p>
                    <HeadingTag>{translateOptional(person.name, language)}</HeadingTag>
                  </section>
                )
              })}
            </div>
          </div>
          <nav className="contact-links" aria-labelledby="contact-links-heading">
            <p id="contact-links-heading" className="contact-links-heading">
              {translate(contactDetails.linksLabel, language)}
            </p>
            <div className="contact-link-actions">
              {contactDetails.links.map((link) => (
                <a
                  key={link.href}
                  className="contact-link"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{translateOptional(link.label, language)}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      </section>
    </>
  )
}

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="content-width footer-inner">
        <div>
          <strong>Scholka Aureolka</strong>
          <p lang="la">{footerQuote}</p>
        </div>
        <dl className="footer-credits" aria-label="Site credits">
          {footerCredits.map((credit) => (
            <div className="footer-credit" key={credit.label}>
              <dt>{credit.label}</dt>
              <dd>{credit.value}</dd>
            </div>
          ))}
        </dl>
        <p className="footer-meta">© {year}</p>
      </div>
    </footer>
  )
}

function App() {
  const googleCalendarConfig = useMemo(() => getGoogleCalendarConfig(), [])
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme)
  const [calendarState, setCalendarState] = useState<CalendarState>({
    status: googleCalendarConfig ? 'loading' : 'unconfigured',
    events: [],
  })
  const activePage = getPageFromPath(window.location.pathname)
  const upcomingEvents = calendarState.events

  useEffect(() => {
    if (!googleCalendarConfig) {
      return
    }

    let isActive = true

    fetchConfiguredCalendarEvents(googleCalendarConfig, language)
      .then((events) => {
        if (!isActive) {
          return
        }

        setCalendarState({
          status: 'ready',
          events,
        })
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setCalendarState({
          status: 'error',
          events: [],
        })
      })

    return () => {
      isActive = false
    }
  }, [googleCalendarConfig, language])

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem(languageStorageKey, language)
  }, [language])

  useEffect(() => {
    const navigationItem = navigationItems.find((item) => item.key === activePage)
    document.title =
      activePage === 'home' || !navigationItem
        ? 'Scholka Aureolka'
        : `${translate(navigationItem.label, language)} | Scholka Aureolka`
  }, [activePage, language])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        {translate(commonText.skipToContent, language)}
      </a>
      <Header
        activePage={activePage}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
      <main id="main-content">
        {activePage === 'home' && (
          <HomePage language={language} theme={theme} upcomingEvents={upcomingEvents} />
        )}
        {activePage === 'gallery' && <GalleryPage language={language} />}
        {activePage === 'schedule' && (
          <SchedulePage
            language={language}
            upcomingEvents={upcomingEvents}
            calendarStatus={calendarState.status}
          />
        )}
        {activePage === 'contact' && <ContactPage language={language} />}
      </main>
      <Footer />
    </div>
  )
}

export default App
