import { contactDetails, defaultLanguage, type Language } from '../siteContent'
import { PageHeading } from '../components/Layout'
import { translate, translateOptional } from '../core'

function ContactPage({ language }: Readonly<{ language: Language }>) {
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

export { ContactPage }
