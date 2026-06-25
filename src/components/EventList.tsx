import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
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
  isExpandableScheduleEvent,
  translate,
  type CalendarEventAttachment,
  type CalendarRichBlock,
  type UpcomingEvent,
} from '../core'

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

function stopCalendarLinkPropagation(mouseEvent: ReactMouseEvent<HTMLElement>) {
  if ((mouseEvent.target as HTMLElement).closest('a')) {
    mouseEvent.stopPropagation()
  }
}

function CalendarRichContent({
  blocks,
  language,
  className = 'calendar-rich-text',
}: {
  blocks: CalendarRichBlock[] | undefined
  language: Language
  className?: string
}) {
  if (!blocks || blocks.length === 0) {
    return null
  }

  return (
    <div className={className} onClick={stopCalendarLinkPropagation}>
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          return (
            <p
              key={index}
              dangerouslySetInnerHTML={{ __html: formatLocalizedHtml(block.html, language) }}
            />
          )
        }

        if (block.kind === 'spacer') {
          return <div className="calendar-rich-space" key={index} aria-hidden="true" />
        }

        const ListTag = block.kind === 'ordered-list' ? 'ol' : 'ul'

        return (
          <ListTag key={index}>
            {block.items.map((item, itemIndex) => (
              <li
                key={`${index}-${itemIndex}`}
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
}: {
  attachments: CalendarEventAttachment[] | undefined
  language: Language
  className?: string
}) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className={className} onClick={stopCalendarLinkPropagation}>
      <p className="event-attachments-title">{translate(scheduleText.attachmentsLabel, language)}</p>
      <ul>
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <a href={attachment.url} target="_blank" rel="noreferrer">
              {attachment.iconUrl && <img src={attachment.iconUrl} alt="" />}
              <span>{attachment.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
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
              <div className="event-details" id={detailsId}>
                {event.location && (
                  <dl className="event-detail-list">
                    <div>
                      <dt>{translate(scheduleText.whereLabel, language)}</dt>
                      <dd>{event.location}</dd>
                    </div>
                  </dl>
                )}
                <CalendarRichContent
                  blocks={event.noteBlocks}
                  language={language}
                  className="event-detail-note calendar-rich-text"
                />
                <AttachmentList attachments={event.attachments} language={language} />
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

function ImportantNotice({
  language,
  notices,
}: {
  language: Language
  notices: UpcomingEvent[]
}) {
  if (notices.length === 0) {
    return null
  }

  return (
    <div
      className="important-notice-stack"
      role="status"
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
