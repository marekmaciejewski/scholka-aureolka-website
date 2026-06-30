import { expect, test, type Page } from '@playwright/test'

const languageStorageKey = 'scholka-aureolka-language'
const themeStorageKey = 'scholka-aureolka-theme'

const corePages = [
  { path: '/', heading: 'Scholka Aureolka', title: 'Scholka Aureolka' },
  { path: '/gallery/', heading: 'Gallery', title: 'Gallery | Scholka Aureolka' },
  { path: '/schedule/', heading: 'Schedule', title: 'Schedule | Scholka Aureolka' },
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
  await page.waitForLoadState('networkidle')
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
      await expandableCards.first().locator('.event-card-toggle').click()
      await expect(page.locator('.event-details')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  }

  expect(errors).toEqual([])
})

test('gallery album navigation and lightbox stay within the viewport', async ({ page }) => {
  const errors = trackUnexpectedPageErrors(page)
  await page.goto('/gallery/')

  await expect(page.getByRole('heading', { level: 1, name: 'Gallery' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expectNoHorizontalOverflow(page)

  const albumCards = page.locator('.gallery-album-card')
  const albumCount = await albumCards.count()

  if (albumCount === 0) {
    await expect(page.locator('.gallery-status')).toBeVisible()
    expect(errors).toEqual([])
    return
  }

  await page.evaluate(() => globalThis.scrollTo({ top: 360, behavior: 'instant' }))
  await albumCards.first().click()
  await expect(page.locator('.gallery-album-header')).toBeVisible()
  await expect(page).toHaveURL(/album=/)
  await expect.poll(() => page.evaluate(() => Math.round(globalThis.scrollY))).toBe(0)
  await expectNoHorizontalOverflow(page)

  const photoTiles = page.locator('.photo-tile')
  const photoCount = await photoTiles.count()

  if (photoCount > 0) {
    await photoTiles.first().click()
    await expect(page.locator('.gallery-lightbox')).toBeVisible()
    await expectOverlayInsideViewport(page, '.gallery-lightbox-backdrop')
    await expectOverlayInsideViewport(page, '.gallery-lightbox')
    await page.locator('.gallery-lightbox').getByRole('button', { name: 'Close photo' }).click()
    await expect(page.locator('.gallery-lightbox')).toHaveCount(0)
  }

  await page.getByRole('button', { name: 'Back to albums' }).click()
  await expect(page).not.toHaveURL(/album=/)
  await expect.poll(() => page.evaluate(() => Math.round(globalThis.scrollY))).toBe(0)
  await expectNoHorizontalOverflow(page)

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
