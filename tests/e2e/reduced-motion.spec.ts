import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('scholka-aureolka-language', 'en')
    localStorage.setItem('scholka-aureolka-theme', 'light')
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/contact/')
})

async function showMotionFixture(page: Page) {
  // Keep the real stylesheet and isolate interactions from remote calendar/Drive data.
  await page.locator('main').evaluate((main) => {
    main.innerHTML = `
      <div class="content-width" style="max-width: 280px">
        <a class="event-card event-card-link" href="#main-content">Event</a>
        <a class="gallery-album-card" href="#main-content">Album</a>
        <a class="photo-tile" href="#main-content">Photo</a>
        <a class="achievement-card" href="#main-content">Achievement</a>
        <article class="event-card event-card-clickable">
          <button class="event-action-button event-copy-link-button">Copy event</button>
        </article>
        <article class="song-card">
          <button class="song-copy-button">Copy song</button>
        </article>
        <span class="gallery-image gallery-image-cover" style="height: 70px">
          <span class="gallery-image-spinner">
            <span class="gallery-image-loading-logo">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg>
            </span>
          </span>
        </span>
      </div>
    `
  })
}

test('reduced motion preserves skip navigation and theme-switch positions', async ({ page }) => {
  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeInViewport()
  await expect(skipLink).toHaveCSS('transition-duration', '0s')
  await skipLink.press('Enter')
  await expect(page).toHaveURL(/#main-content$/)

  const openMenu = page.getByRole('button', { name: 'Open menu' })
  if (await openMenu.isVisible()) {
    await openMenu.click()
  }

  const thumb = page.locator('.switch-thumb')
  await expect(thumb).toHaveCSS('transition-duration', '0s')
  await expect(thumb).toHaveCSS('transform', 'none')
  await page.locator('.theme-switch').click()
  await expect(page.getByRole('switch', { name: 'Dark theme' })).toBeChecked()
  await expect(thumb).not.toHaveCSS('transform', 'none')
  await page.locator('.theme-switch').click()
  await expect(thumb).toHaveCSS('transform', 'none')
})

test('reduced motion keeps cards still, copy controls usable, and loading feedback visible', async ({ page }) => {
  await showMotionFixture(page)
  const cards = page.locator('.event-card-link, .gallery-album-card, .photo-tile, .achievement-card')

  // Keyboard focus must retain a visible cue even when movement is removed.
  await page.keyboard.press('Tab')
  for (const card of await cards.all()) {
    const restingShadow = await card.evaluate((element) => getComputedStyle(element).boxShadow)
    await card.focus()
    await expect(card).toBeFocused()
    await expect(card).toHaveCSS('transform', 'none')
    await expect(card).not.toHaveCSS('box-shadow', restingShadow)
    await card.hover()
    await expect(card).toHaveCSS('transform', 'none')
  }

  for (const name of ['Copy event', 'Copy song']) {
    const button = page.getByRole('button', { name })
    await expect(button).toHaveCSS('transform', 'none')
    await expect(button).toHaveCSS('pointer-events', 'auto')
    await button.click()
    await expect(button).toBeFocused()
  }

  const loader = page.locator('.gallery-image-loading-logo')
  await expect(loader).toBeVisible()
  await expect(page.locator('.gallery-image-spinner')).toHaveCSS('opacity', '1')
  await expect(loader).toHaveCSS('animation-name', 'none')

  const album = page.getByRole('link', { name: 'Album', exact: true })
  await page.keyboard.press('Tab')
  await album.focus()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(album).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -1)')
  await expect(loader).toHaveCSS('animation-name', 'gallery-image-spin')

  // A preference change takes effect on the current page without reloading.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(album).toHaveCSS('transform', 'none')
  await expect(album).toBeFocused()
  await expect(loader).toHaveCSS('animation-name', 'none')
  await expect(loader).toBeVisible()
})
