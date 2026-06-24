import { useState } from 'react'
import {
  commonText,
  footerCredits,
  footerQuote,
  languageOptions,
  navigationItems,
  pageIntro,
  type Language,
  type PageKey,
  type ThemeName,
} from '../siteContent'
import { getLogoForTheme, translate, withBasePath } from '../core'

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
        {intro.lead && <p>{translate(intro.lead, language)}</p>}
      </div>
    </section>
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

export { Footer, Header, PageHeading }
