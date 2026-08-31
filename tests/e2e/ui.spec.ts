import { expect, test, type Page } from '@playwright/test'

const languageStorageKey = 'scholka-aureolka-language'
const themeStorageKey = 'scholka-aureolka-theme'

const corePages = [
  { path: '/', heading: 'Scholka Aureolka', title: 'Scholka Aureolka' },
  { path: '/gallery/', heading: 'Gallery', title: 'Gallery | Scholka Aureolka' },
  { path: '/schedule/', heading: 'Schedule', title: 'Schedule | Scholka Aureolka' },
  { path: '/songs/', heading: 'Songs', title: 'Songs | Scholka Aureolka' },
  { path: '/frequency/', heading: 'Attendance', title: 'Attendance | Scholka Aureolka' },
  { path: '/contact/', heading: 'Contact', title: 'Contact | Scholka Aureolka' },
] as const

type HorizontalOverflowReport = {
  clientWidth: number
  scrollWidth: number
  overflowingElements: Array<{
    className: string
    right: number
    tagName: string
    text: string
    width: number
  }>
}

type EventActionLayoutMetrics = {
  actionBottom: number
  actionLeft: number
  actionPosition: string
  actionRight: number
  actionTop: number
  cardBottom: number
  cardLeft: number
  cardRight: number
  cardTop: number
  titleBottom: number
  titleLeft: number
  titleRight: number
  titleTop: number
}

type EventCopyButtonState = {
  backgroundColor: string
  borderColor: string
  clipPath: string
  color: string
  opacity: string
  pointerEvents: string
  transform?: string
}

function trackUnexpectedPageErrors(page: Page) {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return errors
}

async function preparePage(page: Page) {
  await page.addInitScript(
    ({ languageKey, themeKey }) => {
      globalThis.localStorage.setItem(languageKey, 'en')
      globalThis.localStorage.setItem(themeKey, 'light')
    },
    { languageKey: languageStorageKey, themeKey: themeStorageKey },
  )
}

async function openMobileMenuIfPresent(page: Page) {
  const openMenuButton = page.getByRole('button', { name: 'Open menu' })

  if (await openMenuButton.isVisible()) {
    await openMenuButton.click()
  }
}

async function closeMobileMenuIfPresent(page: Page) {
  const closeMenuButton = page.getByRole('button', { name: 'Close menu' })

  if (await closeMenuButton.isVisible()) {
    await closeMenuButton.click()
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  const report: HorizontalOverflowReport = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth
    const scrollWidth = document.documentElement.scrollWidth
    const elements = Array.from(document.body.querySelectorAll<HTMLElement>('*')).slice(0, 800)
    const overflowingElements = elements
      .map((element) => {
        const rect = element.getBoundingClientRect()

        return {
          className: typeof element.className === 'string' ? element.className : '',
          right: Math.round(rect.right),
          tagName: element.tagName.toLowerCase(),
          text: (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
          width: Math.round(rect.width),
        }
      })
      .filter((element) => element.width > 0 && element.right > clientWidth + 1)
      .slice(0, 8)

    return { clientWidth, scrollWidth, overflowingElements }
  })

  expect(report.scrollWidth, JSON.stringify(report, null, 2)).toBeLessThanOrEqual(
    report.clientWidth + 1,
  )
  expect(report.overflowingElements).toEqual([])
}

async function expectOverlayInsideViewport(page: Page, selector: string) {
  const metrics = await page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const viewportHeight = globalThis.visualViewport?.height ?? globalThis.innerHeight
    const viewportWidth = globalThis.visualViewport?.width ?? globalThis.innerWidth

    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      viewportHeight,
      viewportWidth,
      width: rect.width,
    }
  })

  expect(metrics.top).toBeGreaterThanOrEqual(0)
  expect(metrics.left).toBeGreaterThanOrEqual(0)
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 1)
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1)
  expect(metrics.height).toBeGreaterThan(0)
  expect(metrics.width).toBeGreaterThan(0)
}

async function expectScheduleReady(page: Page) {
  await expect(
    page
      .locator(
        '.event-card, .schedule-empty, .schedule-status.error, .schedule-status.unconfigured',
      )
      .first(),
  ).toBeVisible({ timeout: 15_000 })
}

async function expandFirstEventCard(page: Page) {
  const firstExpandableCard = page.locator('.event-card-clickable').first()

  await firstExpandableCard.evaluate((card) => {
    card.scrollIntoView({ block: 'center' })
  })
  await firstExpandableCard.locator('.event-card-toggle').click({
    position: { x: 24, y: 72 },
  })
}

async function injectEventActionFixture(page: Page, variant: 'compact-home' | 'schedule') {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Scholka Aureolka' })).toBeVisible()
  await page.evaluate((fixtureVariant) => {
    const main = document.querySelector('#main-content')

    if (!main) {
      throw new Error('Main content was not rendered')
    }

    const outerClass =
      fixtureVariant === 'compact-home'
        ? 'content-width home-upcoming-inner'
        : 'content-width narrow month-list'
    const listClass = fixtureVariant === 'compact-home' ? 'event-list compact' : 'event-list'
    const cardClass =
      fixtureVariant === 'compact-home'
        ? 'event-card event-card-link event-card--important has-details'
        : 'event-card event-card-clickable event-card--important has-details'
    const copyButton =
      fixtureVariant === 'schedule'
        ? '<button class="event-action-button event-copy-link-button" type="button" aria-label="Copy link"><svg class="event-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 13.5 13.5 10.5" /></svg></button>'
        : ''
    const detailSymbol =
      fixtureVariant === 'schedule'
        ? '<span class="event-expand-status-icon" aria-hidden="true"><svg class="event-expand-status-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></span>'
        : '<span class="event-expand-status-icon" aria-hidden="true">+</span>'

    main.innerHTML = `
      <section class="content-section">
        <div class="${outerClass}">
          <div class="${listClass}">
            <article class="${cardClass}">
              <div class="event-card-summary">
                <button class="event-card-toggle" type="button" aria-label="Expand event"></button>
                <div class="event-date">
                  <strong>Thursday, July 2</strong>
                  <span>17:00</span>
                  <span class="event-time-chip">tomorrow</span>
                </div>
                <div class="event-body">
                  <div class="event-title-row">
                    <h3>PRZYWIDZ</h3>
                    <div class="event-title-actions">
                      ${copyButton}
                      ${detailSymbol}
                    </div>
                  </div>
                  <p class="muted">Zielona Brama wesela, stadnina, pierogarnia, Gdańska 26</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    `
  }, variant)
}

async function injectSongCopyFixture(page: Page) {
  await page.goto('/songs/')
  await page.evaluate(() => {
    const main = document.querySelector('main')

    if (!main) {
      throw new Error('Main content was not rendered')
    }

    main.innerHTML = `
      <section class="content-section">
        <div class="content-width">
          <div class="song-list">
            <article class="song-card">
              <div class="song-card-heading">
                <h3>Amen</h3>
                <button class="song-copy-button" type="button" aria-label="Copy song link">
                  <svg class="song-action-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10.5 13.5 13.5 10.5"></path>
                  </svg>
                </button>
              </div>
              <p class="song-empty-materials">No listening materials yet</p>
            </article>
          </div>
        </div>
      </section>
    `
  })
}

async function getEventActionLayoutMetrics(page: Page) {
  return page.locator('.event-card').evaluate((card): EventActionLayoutMetrics => {
    const actions = card.querySelector<HTMLElement>('.event-title-actions')
    const title = card.querySelector<HTMLElement>('.event-title-row h3')

    if (!actions || !title) {
      throw new Error('Event card action fixture was not rendered')
    }

    const actionRect = actions.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const titleRect = title.getBoundingClientRect()

    return {
      actionBottom: actionRect.bottom,
      actionLeft: actionRect.left,
      actionPosition: getComputedStyle(actions).position,
      actionRight: actionRect.right,
      actionTop: actionRect.top,
      cardBottom: cardRect.bottom,
      cardLeft: cardRect.left,
      cardRight: cardRect.right,
      cardTop: cardRect.top,
      titleBottom: titleRect.bottom,
      titleLeft: titleRect.left,
      titleRight: titleRect.right,
      titleTop: titleRect.top,
    }
  })
}

async function getEventCopyButtonState(page: Page) {
  return page.locator('.event-copy-link-button').evaluate((button): EventCopyButtonState => {
    const buttonStyle = getComputedStyle(button)

    return {
      backgroundColor: buttonStyle.backgroundColor,
      borderColor: buttonStyle.borderColor,
      clipPath: buttonStyle.clipPath,
      color: buttonStyle.color,
      opacity: buttonStyle.opacity,
      pointerEvents: buttonStyle.pointerEvents,
      transform: buttonStyle.transform,
    }
  })
}

async function getSongCopyButtonState(page: Page) {
  return page.locator('.song-copy-button').evaluate((button): EventCopyButtonState => {
    const buttonStyle = getComputedStyle(button)

    return {
      backgroundColor: buttonStyle.backgroundColor,
      borderColor: buttonStyle.borderColor,
      clipPath: buttonStyle.clipPath,
      color: buttonStyle.color,
      opacity: buttonStyle.opacity,
      pointerEvents: buttonStyle.pointerEvents,
      transform: buttonStyle.transform,
    }
  })
}

function isCopyButtonUnclipped(state: EventCopyButtonState) {
  return state.clipPath === 'none' || /^inset\(0px(?: 0px){0,3}\)$/.test(state.clipPath)
}

function isTransparentColor(value: string) {
  return value === 'transparent' || /^rgba\(\d+, \d+, \d+, 0\)$/.test(value)
}

function getCopyButtonScale(state: EventCopyButtonState) {
  if (!state.transform || state.transform === 'none') {
    return 1
  }

  const matrixParts = state.transform.match(/^matrix\(([^)]+)\)$/)?.[1]?.split(',').map(Number)

  if (!matrixParts || matrixParts.length < 4 || matrixParts.some(Number.isNaN)) {
    return 1
  }

  return Math.max(Math.abs(matrixParts[0]), Math.abs(matrixParts[3]))
}

function expectCopyButtonOpen(state: EventCopyButtonState) {
  expect(isCopyButtonUnclipped(state), state.clipPath).toBe(true)
  expect(getCopyButtonScale(state), state.transform).toBeGreaterThan(0.95)
  expect(isTransparentColor(state.backgroundColor), state.backgroundColor).toBe(false)
  expect(isTransparentColor(state.borderColor), state.borderColor).toBe(false)
  expect(state.opacity).toBe('1')
  expect(state.pointerEvents).toBe('auto')
}

function expectCopyButtonSeed(state: EventCopyButtonState) {
  expect(isCopyButtonUnclipped(state), state.clipPath).toBe(true)
  expect(getCopyButtonScale(state), state.transform).toBeLessThan(0.75)
  expect(isTransparentColor(state.backgroundColor), state.backgroundColor).toBe(true)
  expect(isTransparentColor(state.borderColor), state.borderColor).toBe(true)
  expect(state.opacity).toBe('1')
  expect(state.pointerEvents).toBe('none')
}

function isCopyButtonOpen(state: EventCopyButtonState) {
  return (
    isCopyButtonUnclipped(state) &&
    getCopyButtonScale(state) > 0.95 &&
    !isTransparentColor(state.backgroundColor) &&
    !isTransparentColor(state.borderColor) &&
    state.opacity === '1' &&
    state.pointerEvents === 'auto'
  )
}

function expectActionsInsideCard(metrics: EventActionLayoutMetrics) {
  expect(metrics.actionTop).toBeGreaterThanOrEqual(metrics.cardTop)
  expect(metrics.actionLeft).toBeGreaterThanOrEqual(metrics.cardLeft)
  expect(metrics.actionRight).toBeLessThanOrEqual(metrics.cardRight)
  expect(metrics.actionBottom).toBeLessThanOrEqual(metrics.cardBottom)
}

function expectActionsAnchoredToCardFrame(metrics: EventActionLayoutMetrics) {
  expect(metrics.actionPosition).toBe('absolute')
  expect(metrics.actionTop - metrics.cardTop).toBeGreaterThanOrEqual(13)
  expect(metrics.actionTop - metrics.cardTop).toBeLessThanOrEqual(16)
  expect(metrics.cardRight - metrics.actionRight).toBeGreaterThanOrEqual(15)
  expect(metrics.cardRight - metrics.actionRight).toBeLessThanOrEqual(17)
  expectActionsInsideCard(metrics)
}

test.beforeEach(async ({ page }) => {
  await preparePage(page)
})

test('core pages render at each breakpoint without horizontal overflow', async ({ page }) => {
  const errors = trackUnexpectedPageErrors(page)

  for (const corePage of corePages) {
    await page.goto(corePage.path)
    await expect(page).toHaveTitle(corePage.title)
    await expect(page.getByRole('heading', { level: 1, name: corePage.heading })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  }

  expect(errors).toEqual([])
})

test('responsive header exposes navigation and preference controls', async ({ page }) => {
  const errors = trackUnexpectedPageErrors(page)
  await page.goto('/')
  const header = page.locator('.site-header')
  const openMenuButton = page.getByRole('button', { name: 'Open menu' })

  if (await openMenuButton.isVisible()) {
    await openMenuButton.click()
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible()
  }

  await expect(header.getByRole('link', { name: 'Schedule' })).toBeVisible()
  await expect(header.getByRole('button', { name: 'PL' })).toBeVisible()
  await expect(header.getByLabel('Dark theme')).toBeVisible()
  await expectNoHorizontalOverflow(page)

  expect(errors).toEqual([])
})

test('language, theme, and first-steps dialog remain usable', async ({ page }) => {
  const errors = trackUnexpectedPageErrors(page)
  await page.goto('/')
  await openMobileMenuIfPresent(page)
  const header = page.locator('.site-header')
  const themeSwitch = header.locator('.theme-switch')

  await header.getByRole('button', { name: 'PL', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl')
  await expect(header.getByRole('link', { name: 'Start' })).toBeVisible()

  await header.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(header.getByRole('link', { name: 'Schedule' })).toBeVisible()

  await themeSwitch.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await themeSwitch.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await closeMobileMenuIfPresent(page)

  await page.getByRole('button', { name: 'First steps' }).click()
  const dialog = page.locator('.parent-info-modal')
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('heading', { name: 'First steps' })).toBeVisible()
  await expectOverlayInsideViewport(page, '.parent-info-modal')
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toHaveCount(0)
  await expectNoHorizontalOverflow(page)

  expect(errors).toEqual([])
})

test('schedule page handles configured and unconfigured calendar states', async ({ page }) => {
  const errors = trackUnexpectedPageErrors(page)
  await page.goto('/schedule/')

  await expect(page.getByRole('heading', { level: 1, name: 'Schedule' })).toBeVisible()
  await expectScheduleReady(page)
  await expectNoHorizontalOverflow(page)

  const eventCards = page.locator('.event-card')
  const eventCount = await eventCards.count()

  if (eventCount === 0) {
    await expect(page.locator('.schedule-status, .schedule-empty')).toBeVisible()
  } else {
    await expect(eventCards.first()).toBeVisible()

    const expandableCards = page.locator('.event-card-clickable')
    const expandableCount = await expandableCards.count()

    if (expandableCount > 0) {
      await expandFirstEventCard(page)
      await expect(page.locator('.event-details')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  }

  expect(errors).toEqual([])
})

test('event action symbols stay anchored to event cards', async ({ page }) => {
  const viewportWidth = page.viewportSize()?.width ?? 1280
  const isMobile = viewportWidth <= 760

  await injectEventActionFixture(page, 'compact-home')
  expectActionsAnchoredToCardFrame(await getEventActionLayoutMetrics(page))

  await injectEventActionFixture(page, 'schedule')
  const scheduleMetrics = await getEventActionLayoutMetrics(page)
  const copyButtonState = await getEventCopyButtonState(page)

  if (isMobile) {
    expectActionsAnchoredToCardFrame(scheduleMetrics)
    expectCopyButtonOpen(copyButtonState)
  } else {
    expect(scheduleMetrics.actionPosition).toBe('static')
    expectActionsInsideCard(scheduleMetrics)
    expect(scheduleMetrics.actionLeft).toBeGreaterThanOrEqual(scheduleMetrics.titleRight)
    expectCopyButtonSeed(copyButtonState)

    await page.locator('.event-card').hover()
    await expect.poll(async () => isCopyButtonOpen(await getEventCopyButtonState(page))).toBe(true)
  }
})

test('song copy buttons emerge on desktop hover only', async ({ page }) => {
  const viewportWidth = page.viewportSize()?.width ?? 1280
  const isMobile = viewportWidth <= 760

  await injectSongCopyFixture(page)
  const copyButtonState = await getSongCopyButtonState(page)

  if (isMobile) {
    expectCopyButtonOpen(copyButtonState)
  } else {
    expectCopyButtonSeed(copyButtonState)

    await page.locator('.song-card').hover()
    await expect.poll(async () => isCopyButtonOpen(await getSongCopyButtonState(page))).toBe(true)

    await page.locator('.song-copy-button').evaluate((button) => {
      button.classList.add('is-copied')
    })
    await page.mouse.move(0, 0)
    await expect.poll(async () => isCopyButtonOpen(await getSongCopyButtonState(page))).toBe(true)
  }
})

test('gallery landing separates public Achievements from private child photos', async ({ page }) => {
  const errors = trackUnexpectedPageErrors(page)
  const driveRequests: string[] = []

  page.on('request', (request) => {
    if (request.url().includes('www.googleapis.com/drive/v3/')) {
      driveRequests.push(request.url())
    }
  })

  await page.goto('/gallery/')

  await expect(page.getByRole('heading', { level: 1, name: 'Gallery' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'The gallery is private' })).toBeVisible()
  await expect(page.locator('.private-gallery-card')).toContainText('approved accounts')
  await expect(
    page.locator('.private-gallery-card .private-gallery-privacy-note'),
  ).toContainText("Let's protect children's privacy")
  await expect(page.locator('.private-gallery-card')).not.toContainText('opens in a new tab')
  await expect(page.locator('.achievements-card-featured')).toContainText('Achievements')
  await expect(page.locator('.achievements-card-featured')).not.toContainText(
    'contains no photos of children',
  )
  await expect(page.locator('.achievements-card-featured')).not.toContainText('Open album')
  await expect(page.locator('.achievements-card-featured')).toHaveAttribute(
    'href',
    '/gallery/?album=achievements',
  )
  await expect(page.locator('.private-gallery-privacy-note')).toContainText(
    "Let's protect children's privacy",
  )
  await expectNoHorizontalOverflow(page)

  const privateGalleryLink = page.locator('.private-gallery-button')
  if ((await privateGalleryLink.count()) > 0) {
    await expect(privateGalleryLink).toHaveAttribute('href', /^https:\/\/sites\.google\.com\//)
    await expect(privateGalleryLink).toHaveAttribute('target', '_blank')
    await expect(privateGalleryLink).toHaveAttribute('rel', 'noreferrer')
  } else {
    await expect(page.locator('.private-gallery-status')).toContainText(
      'The private gallery is being prepared.',
    )
  }

  expect(driveRequests).toEqual([])
  expect(errors).toEqual([])
})

test('Achievements keeps its on-site album route and dated timeline behavior', async ({ page }) => {
  const errors = trackUnexpectedPageErrors(page)

  await page.route('**/drive/v3/files**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        files: [
          {
            id: 'playwright-diploma',
            name: '2026-05-18 - Wyróżnienie -- Distinction.jpg',
            thumbnailLink:
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23ffb400"/%3E%3C/svg%3E',
            imageMediaMetadata: { width: 800, height: 600 },
          },
        ],
      }),
    })
  })

  await page.goto('/gallery/')
  await page.locator('.achievements-card-featured').click()

  await expect(page).toHaveURL(/\/gallery\/\?album=achievements$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Achievements' })).toBeVisible()
  await expectNoHorizontalOverflow(page)

  const unconfiguredStatus = page.locator('.gallery-status.unconfigured')
  if ((await unconfiguredStatus.count()) > 0) {
    await expect(unconfiguredStatus).toContainText('not connected yet')
  } else {
    await expect(page.locator('.achievements-timeline')).toContainText('May 18, 2026')
    await expect(page.locator('.achievement-card')).toContainText('Distinction')
  }

  await page.locator('.gallery-back-button').click()
  await expect(page).toHaveURL(/\/gallery\/$/)
  await expect(page.locator('.private-gallery-card')).toBeVisible()
  expect(errors).toEqual([])
})

test('contact page stays in-person only', async ({ page }) => {
  const errors = trackUnexpectedPageErrors(page)
  await page.goto('/contact/')

  await expect(page.getByRole('heading', { level: 1, name: 'Contact' })).toBeVisible()
  await expect(page.locator('form')).toHaveCount(0)
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0)
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0)
  await expect(page.getByText('You can speak with the organizer in person')).toBeVisible()
  await expectNoHorizontalOverflow(page)

  expect(errors).toEqual([])
})
