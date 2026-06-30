import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  calendarEventHighlightText,
  noticeText,
  scheduleText,
  type Language,
} from '../siteContent'
import {
  formatEventDate,
  formatEventTime,
  formatLocalizedHtml,
  getEventCardStyle,
  getEventDomId,
  getEventRelativeTime,
  isExpandableScheduleEvent,
  translate,
  type CalendarEventAttachment,
  type CalendarRichBlock,
  type UpcomingEvent,
} from '../core'

type CalendarRichKeyCounts = Map<string, number>

type EventListOptions = Readonly<{
  language: Language
  compact?: boolean
  expandable?: boolean
  showDetailSymbols?: boolean
  expandedEventId?: string | null
  linkedEventId?: string | null
  copiedEventId?: string | null
  showLocation?: boolean
  getEventHref?: (event: UpcomingEvent) => string
  onExpandedEventChange?: (eventId: string | null) => void
  onEventLinkCopy?: (event: UpcomingEvent) => void
}>

type EventListProps = EventListOptions &
  Readonly<{
    events: UpcomingEvent[]
  }>

type EventCardProps = EventListOptions &
  Readonly<{
    event: UpcomingEvent
  }>

type EventTitleActionsProps = Readonly<{
  canCopyEventLink: boolean
  event: UpcomingEvent
  isBirthdayEvent: boolean
  isCopied: boolean
  isExpanded: boolean
  language: Language
  shouldShowDetailSymbol: boolean
  onCopyEventLink: (mouseEvent: ReactMouseEvent<HTMLButtonElement>) => void
}>

function CopyLinkIcon({ isCopied }: Readonly<{ isCopied: boolean }>) {
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

function useRichTextLinkPropagationGuard() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const links = Array.from(containerRef.current?.querySelectorAll('a') ?? [])

    function stopPropagation(mouseEvent: MouseEvent) {
      mouseEvent.stopPropagation()
    }

    links.forEach((link) => link.addEventListener('click', stopPropagation))

    return () => {
      links.forEach((link) => link.removeEventListener('click', stopPropagation))
    }
  })

  return containerRef
}

function getCalendarRichBlockBaseKey(block: CalendarRichBlock) {
  if (block.kind === 'paragraph') {
    return `paragraph-${block.html}`
  }

  if (block.kind === 'spacer') {
    return 'spacer'
  }

  return `${block.kind}-${block.items.map((item) => item.html).join('|')}`
}

function getUniqueCalendarRichKey(baseKey: string, keyCounts: CalendarRichKeyCounts) {
  const currentCount = keyCounts.get(baseKey) ?? 0
  keyCounts.set(baseKey, currentCount + 1)

  return currentCount === 0 ? baseKey : `${baseKey}-${currentCount}`
}

function CalendarRichContent({
  blocks,
  language,
  className = 'calendar-rich-text',
}: Readonly<{
  blocks: CalendarRichBlock[] | undefined
  language: Language
  className?: string
}>) {
  const richTextRef = useRichTextLinkPropagationGuard()

  if (!blocks || blocks.length === 0) {
    return null
  }

  const blockKeyCounts: CalendarRichKeyCounts = new Map()

  return (
    <div className={className} ref={richTextRef}>
      {blocks.map((block) => {
        const blockKey = getUniqueCalendarRichKey(
          getCalendarRichBlockBaseKey(block),
          blockKeyCounts,
        )

        if (block.kind === 'paragraph') {
          return (
            <p
              key={blockKey}
              dangerouslySetInnerHTML={{ __html: formatLocalizedHtml(block.html, language) }}
            />
          )
        }

        if (block.kind === 'spacer') {
          return <div className="calendar-rich-space" key={blockKey} aria-hidden="true" />
        }

        const ListTag = block.kind === 'ordered-list' ? 'ol' : 'ul'
        const itemKeyCounts: CalendarRichKeyCounts = new Map()

        return (
          <ListTag key={blockKey}>
            {block.items.map((item) => (
              <li
                key={getUniqueCalendarRichKey(item.html, itemKeyCounts)}
                dangerouslySetInnerHTML={{ __html: formatLocalizedHtml(item.html, language) }}
              />
            ))}
          </ListTag>
        )
      })}
    </div>
  )
}

function AttachmentList({
  attachments,
  language,
  className = 'event-attachments',
}: Readonly<{
  attachments: CalendarEventAttachment[] | undefined
  language: Language
  className?: string
}>) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <p className="event-attachments-title">{translate(scheduleText.attachmentsLabel, language)}</p>
      <ul>
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              onClick={(mouseEvent) => mouseEvent.stopPropagation()}
            >
              {attachment.iconUrl && <img src={attachment.iconUrl} alt="" />}
              <span>{attachment.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function getEventDetailsId(event: UpcomingEvent) {
  return `event-details-${event.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

function getEventCardClassName({
  canExpandEvent,
  eventHref,
  isBirthdayEvent,
  isExpanded,
  isImportantEvent,
  isLinked,
  shouldShowDetailSymbol,
}: Readonly<{
  canExpandEvent: boolean
  eventHref: string | undefined
  isBirthdayEvent: boolean
  isExpanded: boolean
  isImportantEvent: boolean
  isLinked: boolean
  shouldShowDetailSymbol: boolean
}>) {
  return [
    'event-card',
    eventHref ? 'event-card-link' : '',
    canExpandEvent ? 'event-card-clickable' : '',
    isBirthdayEvent ? 'event-card--birthday' : '',
    isImportantEvent ? 'event-card--important' : '',
    shouldShowDetailSymbol ? 'has-details' : '',
    isExpanded ? 'is-expanded' : '',
    isLinked ? 'is-linked' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function shouldIgnoreEventCardToggle(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a, button'))
}

function getEventTimeChipStyle(progressPercent: number) {
  return {
    '--event-time-progress': `${progressPercent}%`,
  } as CSSProperties
}

function EventTitleActions({
  canCopyEventLink,
  event,
  isBirthdayEvent,
  isCopied,
  isExpanded,
  language,
  shouldShowDetailSymbol,
  onCopyEventLink,
}: EventTitleActionsProps) {
  const copyButtonClassName = isCopied
    ? 'event-action-button event-copy-link-button is-copied'
    : 'event-action-button event-copy-link-button'
  const copyEventLinkText = translate(
    isCopied ? scheduleText.eventLinkCopied : scheduleText.copyEventLink,
    language,
  )

  return (
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
          className={copyButtonClassName}
          aria-label={`${copyEventLinkText}: ${event.title}`}
          onClick={onCopyEventLink}
        >
          <CopyLinkIcon isCopied={isCopied} />
        </button>
      )}
      {shouldShowDetailSymbol && (
        <span className="event-expand-status-icon" aria-hidden="true">
          {isExpanded ? '-' : '+'}
        </span>
      )}
    </div>
  )
}

function EventDetails({
  detailsId,
  event,
  language,
}: Readonly<{
  detailsId: string
  event: UpcomingEvent
  language: Language
}>) {
  return (
    <div className="event-details" id={detailsId}>
      <CalendarRichContent
        blocks={event.noteBlocks}
        language={language}
        className="event-detail-note calendar-rich-text"
      />
      <AttachmentList attachments={event.attachments} language={language} />
    </div>
  )
}

function EventCard({
  event,
  language,
  compact = false,
  expandable = false,
  showDetailSymbols = expandable,
  expandedEventId = null,
  linkedEventId = null,
  copiedEventId = null,
  showLocation = true,
  getEventHref,
  onExpandedEventChange,
  onEventLinkCopy,
}: EventCardProps) {
  const eventHighlight = event.eventHighlight
  const isBirthdayEvent = eventHighlight?.kind === 'birthday'
  const isImportantEvent = eventHighlight?.kind === 'important'
  const hasEventDetails = isExpandableScheduleEvent(event)
  const canExpandEvent = expandable && hasEventDetails
  const shouldShowDetailSymbol = showDetailSymbols && hasEventDetails
  const isExpanded = canExpandEvent && expandedEventId === event.id
  const detailsId = getEventDetailsId(event)
  const canCopyEventLink = canExpandEvent && Boolean(event.slug)
  const eventHref = getEventHref?.(event)
  const relativeTime = getEventRelativeTime(event.date, language)
  const eventCardClassName = getEventCardClassName({
    canExpandEvent,
    eventHref,
    isBirthdayEvent,
    isExpanded,
    isImportantEvent,
    isLinked: linkedEventId === event.id,
    shouldShowDetailSymbol,
  })

  function toggleEvent() {
    if (canExpandEvent && onExpandedEventChange) {
      onExpandedEventChange(isExpanded ? null : event.id)
    }
  }

  function handleCardClick(mouseEvent: ReactMouseEvent<HTMLElement>) {
    if (!canExpandEvent || shouldIgnoreEventCardToggle(mouseEvent.target)) {
      return
    }

    toggleEvent()
  }

  function handleCardKeyDown(keyboardEvent: ReactKeyboardEvent<HTMLElement>) {
    if (!canExpandEvent || keyboardEvent.target !== keyboardEvent.currentTarget) {
      return
    }

    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault()
      toggleEvent()
    }
  }

  function handleCopyEventLink(mouseEvent: ReactMouseEvent<HTMLButtonElement>) {
    mouseEvent.stopPropagation()

    if (canCopyEventLink && onEventLinkCopy) {
      onEventLinkCopy(event)
    }
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
          {relativeTime && (
            <span
              className="event-time-chip"
              style={getEventTimeChipStyle(relativeTime.progressPercent)}
            >
              {relativeTime.label}
            </span>
          )}
        </div>
        <div className="event-body">
          <div className="event-title-row">
            <h3>{event.title}</h3>
            <EventTitleActions
              canCopyEventLink={canCopyEventLink}
              event={event}
              isBirthdayEvent={isBirthdayEvent}
              isCopied={copiedEventId === event.id}
              isExpanded={isExpanded}
              language={language}
              shouldShowDetailSymbol={shouldShowDetailSymbol}
              onCopyEventLink={handleCopyEventLink}
            />
          </div>
          {showLocation && event.location && <p className="muted">{event.location}</p>}
          {!compact && !expandable && !eventHref && (
            <>
              <CalendarRichContent
                blocks={event.noteBlocks}
                language={language}
                className="event-summary-note calendar-rich-text"
              />
              <AttachmentList attachments={event.attachments} language={language} />
            </>
          )}
        </div>
      </div>

      {canExpandEvent && isExpanded && (
        <EventDetails detailsId={detailsId} event={event} language={language} />
      )}
    </>
  )

  if (eventHref) {
    return (
      <a
        className={eventCardClassName}
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
      id={getEventDomId(event)}
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
      style={getEventCardStyle(event)}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {eventCardContent}
    </article>
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
  showLocation = true,
  getEventHref,
  onExpandedEventChange,
  onEventLinkCopy,
}: EventListProps) {
  return (
    <div className={compact ? 'event-list compact' : 'event-list'}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          language={language}
          compact={compact}
          expandable={expandable}
          showDetailSymbols={showDetailSymbols}
          expandedEventId={expandedEventId}
          linkedEventId={linkedEventId}
          copiedEventId={copiedEventId}
          showLocation={showLocation}
          getEventHref={getEventHref}
          onExpandedEventChange={onExpandedEventChange}
          onEventLinkCopy={onEventLinkCopy}
        />
      ))}
    </div>
  )
}

function ImportantNotice({
  language,
  notices,
}: Readonly<{
  language: Language
  notices: UpcomingEvent[]
}>) {
  if (notices.length === 0) {
    return null
  }

  return (
    <div
      className="important-notice-stack"
      aria-label={translate(noticeText.listLabel, language)}
    >
      {notices.map((notice) => (
        <article className="important-notice" key={notice.id}>
          <strong>{notice.title}</strong>
          <CalendarRichContent
            blocks={notice.noteBlocks}
            language={language}
            className="important-notice-body calendar-rich-text"
          />
          <AttachmentList
            attachments={notice.attachments}
            language={language}
            className="important-notice-attachments event-attachments"
          />
        </article>
      ))}
    </div>
  )
}

export { EventList, ImportantNotice }
