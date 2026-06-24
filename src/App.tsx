import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { commonText, type Language, type PageKey, type ThemeName } from './siteContent'
import { Footer, Header } from './components/Layout'
import { ContactPage } from './pages/ContactPage'
import { GalleryPage } from './pages/GalleryPage'
import { HomePage } from './pages/HomePage'
import { SchedulePage } from './pages/SchedulePage'
import {
  fetchConfiguredCalendarEvents,
  getGoogleCalendarConfig,
  getInitialLanguage,
  getInitialTheme,
  getPageDocumentTitle,
  getPageFromPath,
  languageStorageKey,
  splitCalendarEvents,
  themeStorageKey,
  translate,
  type CalendarLoadStatus,
  type CalendarState,
  type UpcomingEvent,
} from './core'

type PageRenderContext = {
  language: Language
  theme: ThemeName
  noticeEvents: UpcomingEvent[]
  scheduleEvents: UpcomingEvent[]
  calendarStatus: CalendarLoadStatus
}

const pageRenderers: Record<PageKey, (context: PageRenderContext) => ReactNode> = {
  home: ({ language, theme, noticeEvents, scheduleEvents }) => (
    <HomePage
      language={language}
      theme={theme}
      noticeEvents={noticeEvents}
      upcomingEvents={scheduleEvents}
    />
  ),
  gallery: ({ language }) => <GalleryPage language={language} />,
  schedule: ({ language, scheduleEvents, calendarStatus }) => (
    <SchedulePage
      language={language}
      upcomingEvents={scheduleEvents}
      calendarStatus={calendarStatus}
    />
  ),
  contact: ({ language }) => <ContactPage language={language} />,
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
  const { noticeEvents, scheduleEvents } = useMemo(
    () => splitCalendarEvents(calendarState.events),
    [calendarState.events],
  )
  const activePageContent = pageRenderers[activePage]({
    language,
    theme,
    noticeEvents,
    scheduleEvents,
    calendarStatus: calendarState.status,
  })

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
    document.title = getPageDocumentTitle(activePage, language)
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
      <main id="main-content">{activePageContent}</main>
      <Footer />
    </div>
  )
}

export default App
