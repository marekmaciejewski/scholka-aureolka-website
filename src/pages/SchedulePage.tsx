import { useEffect, useState, type ReactNode } from 'react'
import { scheduleText, type Language } from '../siteContent'
import { EventList } from '../components/EventList'
import { PageHeading } from '../components/Layout'
import {
  copyTextToClipboard,
  getAbsoluteScheduleEventHref,
  getEventDomId,
  getEventSlugFromLocation,
  groupEventsByMonth,
  isExpandableScheduleEvent,
  replaceScheduleEventUrl,
  translate,
  type CalendarLoadStatus,
  type UpcomingEvent,
} from '../core'

function SchedulePage({
  language,
  upcomingEvents,
  calendarStatus,
}: Readonly<{
  language: Language
  upcomingEvents: UpcomingEvent[]
  calendarStatus: CalendarLoadStatus
}>) {
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
    linkedEvent && isExpandableScheduleEvent(linkedEvent) ? linkedEvent.id : null
  const activeExpandedEventId = linkedExpandedEventId ?? stateExpandedEventId
  const linkedEventId = linkedEvent?.id ?? null

  const statusMessage = getScheduleStatusMessage(calendarStatus)
  const shouldShowEmptyState = calendarStatus === 'ready' && upcomingEvents.length === 0
  const shouldShowMissingLinkedEvent =
    calendarStatus === 'ready' && Boolean(linkedEventSlug) && !linkedEvent
  let scheduleContent: ReactNode = null

  if (shouldShowEmptyState) {
    scheduleContent = (
      <p className="schedule-empty">{translate(scheduleText.emptyState, language)}</p>
    )
  } else if (upcomingEvents.length > 0) {
    scheduleContent = groupedEvents.map((group, index) => {
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
  }

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

    globalThis.addEventListener('popstate', handlePopState)

    return () => {
      globalThis.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!linkedEvent) {
      return
    }

    const scrollTimeout = globalThis.setTimeout(() => {
      document
        .getElementById(getEventDomId(linkedEvent))
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 0)

    return () => {
      globalThis.clearTimeout(scrollTimeout)
    }
  }, [linkedEvent])

  return (
    <>
      <PageHeading page="schedule" language={language} />
      <section className="content-section">
        <div className="content-width narrow month-list">
          {statusMessage && (
            <output className={`schedule-status ${calendarStatus}`}>
              {translate(statusMessage, language)}
            </output>
          )}

          {shouldShowMissingLinkedEvent && (
            <output className="schedule-status warning">
              {translate(scheduleText.eventLinkNotFound, language)}
            </output>
          )}

          {scheduleContent}
        </div>
      </section>
    </>
  )
}

function getScheduleStatusMessage(calendarStatus: CalendarLoadStatus) {
  if (calendarStatus === 'loading') {
    return scheduleText.loading
  }

  if (calendarStatus === 'error') {
    return scheduleText.errorNotice
  }

  if (calendarStatus === 'unconfigured') {
    return scheduleText.notConfiguredNotice
  }

  return null
}

export { SchedulePage }
