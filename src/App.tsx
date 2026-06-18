import { useEffect, useMemo, useState } from 'react'
import {
  albums,
  commonText,
  contactDetails,
  defaultLanguage,
  eventTemplates,
  footerCredits,
  footerQuote,
  homeActions,
  homeHeroText,
  homeImportantNotice,
  languageOptions,
  logoPaths,
  navigationItems,
  organizationSections,
  pageIntro,
  recurringCalendarNotes,
  scheduleCards,
  type InfoSection,
  type Language,
  type LocalizedText,
  type PageKey,
  type ScheduleCard,
  type ThemeName,
} from './siteContent'

type UpcomingEvent = {
  id: string
  date: Date
  title: string
  location: string
  note: string
}

const languageStorageKey = 'scholka-aureolka-language'
const themeStorageKey = 'scholka-aureolka-theme'
const homeScheduleCards = scheduleCards.slice(0, 2)
const homeHeroActions = homeActions.slice(0, 2)
const childrenMassCard = scheduleCards[2]

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

  if (path === '/calendar') {
    return 'calendar'
  }

  if (path === '/organization') {
    return 'organization'
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

function getNextTemplateDate(
  weekday: number,
  hour: number,
  minute: number,
  fromDate: Date,
) {
  const date = new Date(fromDate)
  date.setHours(hour, minute, 0, 0)

  const dayOffset = (weekday - date.getDay() + 7) % 7
  date.setDate(date.getDate() + dayOffset)

  if (date <= fromDate) {
    date.setDate(date.getDate() + 7)
  }

  return date
}

function createUpcomingEvents(language: Language) {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 3)

  const events: UpcomingEvent[] = []

  eventTemplates.forEach((template) => {
    let date = getNextTemplateDate(template.weekday, template.hour, template.minute, now)

    while (date <= endDate) {
      events.push({
        id: `${template.weekday}-${template.hour}-${template.minute}-${date.toISOString()}`,
        date: new Date(date),
        title: translate(template.title, language),
        location: translate(template.location, language),
        note: translate(template.note, language),
      })

      date = new Date(date)
      date.setDate(date.getDate() + 7)
    }
  })

  return events.sort((first, second) => first.date.getTime() - second.date.getTime())
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
          <span>{translate(commonText.menu, language)}</span>
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
            <span className="visually-hidden">{translate(commonText.themeLabel, language)}</span>
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={(event) => setTheme(event.currentTarget.checked ? 'dark' : 'light')}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span className="switch-label">
              {translate(theme === 'dark' ? commonText.darkTheme : commonText.lightTheme, language)}
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

function ScheduleGrid({
  language,
  cards = scheduleCards,
}: {
  language: Language
  cards?: ScheduleCard[]
}) {
  return (
    <div className="card-grid schedule-grid">
      {cards.map((card) => (
        <article className="info-card" key={translate(card.title, language)}>
          <h3>{translate(card.title, language)}</h3>
          <p className="card-time">{translate(card.time, language)}</p>
          <p>{translate(card.note, language)}</p>
        </article>
      ))}
    </div>
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

function EventList({
  events,
  language,
  compact = false,
}: {
  events: UpcomingEvent[]
  language: Language
  compact?: boolean
}) {
  return (
    <div className={compact ? 'event-list compact' : 'event-list'}>
      {events.map((event) => (
        <article className="event-card" key={event.id}>
          <div className="event-date">
            <strong>{formatEventDate(event.date, language)}</strong>
            <span>{formatEventTime(event.date, language)}</span>
          </div>
          <div>
            <h3>{event.title}</h3>
            <p className="muted">{event.location}</p>
            {!compact && <p>{event.note}</p>}
          </div>
        </article>
      ))}
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

function InfoSectionList({
  sections,
  language,
}: {
  sections: InfoSection[]
  language: Language
}) {
  return (
    <div className="info-list">
      {sections.map((section) => (
        <article className="info-row" key={translate(section.title, language)}>
          <h2>{translate(section.title, language)}</h2>
          <p>{translate(section.body, language)}</p>
        </article>
      ))}
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
                {homeHeroActions.map((action, index) => (
                  <a
                    key={action.href}
                    className={index === 0 ? 'button primary' : 'button secondary'}
                    href={withBasePath(action.href)}
                  >
                    {translate(action.label, language)}
                  </a>
                ))}
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
          <EventList events={upcomingEvents.slice(0, 4)} language={language} compact />
        </div>
      </section>
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

function CalendarPage({
  language,
  upcomingEvents,
}: {
  language: Language
  upcomingEvents: UpcomingEvent[]
}) {
  const groupedEvents = groupEventsByMonth(upcomingEvents, language)

  return (
    <>
      <PageHeading page="calendar" language={language} />
      <section className="content-section">
        <div className="content-width split-section align-start">
          <div className="calendar-notes">
            <ScheduleGrid language={language} />
            <InfoSectionList sections={recurringCalendarNotes} language={language} />
          </div>
          <div className="month-list">
            {groupedEvents.map((group, index) => {
              const headingId = `month-${index}`

              return (
                <section className="month-group" key={group.month} aria-labelledby={headingId}>
                  <h2 id={headingId}>{group.month}</h2>
                  <EventList events={group.events} language={language} />
                </section>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

function OrganizationPage({ language }: { language: Language }) {
  return (
    <>
      <PageHeading page="organization" language={language} />
      <section className="content-section">
        <div className="content-width split-section align-start">
          <div>
            <ScheduleGrid language={language} />
          </div>
          <InfoSectionList sections={organizationSections} language={language} />
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
        <div className="content-width split-section align-start">
          <article className="contact-card">
            <p className="eyebrow">{translate(contactDetails.organizerLabel, language)}</p>
            <h2>{translate(contactDetails.organizerName, language)}</h2>
            <p>{translate(contactDetails.inPerson, language)}</p>
          </article>

          <article className="contact-card">
            <p className="eyebrow">{translate(commonText.externalLinks, language)}</p>
            <div className="placeholder-link">
              <span>{translate(contactDetails.facebook, language)}</span>
              <strong>{language === 'pl' ? 'do uzupełnienia' : 'to be added'}</strong>
            </div>
            <div className="placeholder-link">
              <span>{translate(contactDetails.parish, language)}</span>
              <strong>{language === 'pl' ? 'do uzupełnienia' : 'to be added'}</strong>
            </div>
          </article>
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
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme)
  const activePage = getPageFromPath(window.location.pathname)
  const upcomingEvents = useMemo(() => createUpcomingEvents(language), [language])

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
        {activePage === 'calendar' && (
          <CalendarPage language={language} upcomingEvents={upcomingEvents} />
        )}
        {activePage === 'organization' && <OrganizationPage language={language} />}
        {activePage === 'contact' && <ContactPage language={language} />}
      </main>
      <Footer />
    </div>
  )
}

export default App
