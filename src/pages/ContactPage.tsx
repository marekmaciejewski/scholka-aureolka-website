import { useState } from 'react'
import { contactDetails, defaultLanguage, type Language } from '../siteContent'
import { PageHeading } from '../components/Layout'
import { copyTextToClipboard, translate, translateOptional } from '../core'

type EmailCopyStatus = 'idle' | 'copied' | 'failed'

function getEmailCopyLabel(status: EmailCopyStatus) {
  if (status === 'copied') {
    return contactDetails.email.copiedLabel
  }

  if (status === 'failed') {
    return contactDetails.email.copyFailedLabel
  }

  return contactDetails.email.copyLabel
}

function CopyLinkIcon({ isCopied }: Readonly<{ isCopied: boolean }>) {
  return (
    <svg
      className="song-action-icon"
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

function ContactPage({ language }: Readonly<{ language: Language }>) {
  const [emailCopyStatus, setEmailCopyStatus] = useState<EmailCopyStatus>('idle')
  const emailAddress = contactDetails.email.address
  const emailHref = `mailto:${emailAddress}`
  const copyButtonLabel = translate(getEmailCopyLabel(emailCopyStatus), language)

  function copyEmailAddress() {
    copyTextToClipboard(emailAddress)
      .then(() => setEmailCopyStatus('copied'))
      .catch(() => setEmailCopyStatus('failed'))
  }

  return (
    <>
      <PageHeading page="contact" language={language} />
      <section className="content-section">
        <div className="content-width contact-layout">
          <section className="contact-email" aria-labelledby="contact-email-heading">
            <p id="contact-email-heading" className="contact-links-heading">
              {translate(contactDetails.email.label, language)}
            </p>
            <div className="contact-email-row">
              <a className="contact-link contact-email-address" href={emailHref}>
                <span>{emailAddress}</span>
              </a>
              <button
                type="button"
                className={
                  emailCopyStatus === 'copied'
                    ? 'song-copy-button contact-email-copy is-copied'
                    : 'song-copy-button contact-email-copy'
                }
                aria-label={`${copyButtonLabel}: ${emailAddress}`}
                onClick={copyEmailAddress}
              >
                <CopyLinkIcon isCopied={emailCopyStatus === 'copied'} />
              </button>
            </div>
          </section>
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

export { ContactPage }
