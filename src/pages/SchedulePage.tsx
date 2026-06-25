import { useEffect, useState } from 'react'
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
    linkedEvent && isExpandableScheduleEvent(linkedEvent) ? linkedEvent.id : null
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

export { SchedulePage }
