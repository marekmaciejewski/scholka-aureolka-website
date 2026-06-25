import { useEffect, useState } from 'react'
import {
  commonText,
  firstStepsModal,
  homeHeroCta,
  homeHeroText,
  type Language,
  type ThemeName,
} from '../siteContent'
import { EventList, ImportantNotice } from '../components/EventList'
import {
  childrenMassCard,
  getHomeEventHref,
  getLogoForTheme,
  homeScheduleCards,
  translate,
  withBasePath,
  type UpcomingEvent,
} from '../core'

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
    <div className="modal-backdrop">
      <button
        type="button"
        className="dialog-backdrop-button"
        aria-label={translate(commonText.closeModal, language)}
        tabIndex={-1}
        onClick={onClose}
      />
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
  noticeEvents,
  upcomingEvents,
}: {
  language: Language
  theme: ThemeName
  noticeEvents: UpcomingEvent[]
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
          <ImportantNotice language={language} notices={noticeEvents} />
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

export { HomePage }
