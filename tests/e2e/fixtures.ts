import { expect, test as base } from '@playwright/test'

type ResponseState = 'ready' | 'empty' | 'error'

type GoogleApiFixture = {
  calendar: ResponseState
  gallery: ResponseState
  holdPhotoResponses: () => () => void
}

const album = { id: 'e2e-album', name: '2026-06-20 - Warsztaty -- Workshop' }
const photos = [
  {
    id: 'photo-1',
    name: '01[cover].jpg',
    thumbnailLink: 'https://gallery-fixture.test/photo-1=s220',
    imageMediaMetadata: { width: 1200, height: 800 },
  },
  {
    id: 'photo-2',
    name: '02.jpg',
    thumbnailLink: 'https://gallery-fixture.test/photo-2=s220',
    imageMediaMetadata: { width: 1200, height: 800 },
  },
]

// The test server uses dummy config. Every external request must have an explicit fixture.
export const test = base.extend<{ googleApi: GoogleApiFixture }>({
  googleApi: [async ({ page, baseURL }, runTest) => {
    const unexpectedRequests: string[] = []
    const pendingPhotoResponses: Array<() => void> = []
    let photoResponseGate = Promise.resolve()
    const fixture: GoogleApiFixture = {
      calendar: 'ready',
      gallery: 'ready',
      holdPhotoResponses() {
        let release = () => {}
        photoResponseGate = new Promise<void>((resolve) => {
          release = resolve
        })
        pendingPhotoResponses.push(release)
        return release
      },
    }

    await page.clock.setFixedTime(new Date('2026-06-25T08:00:00+02:00'))
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin === new URL(baseURL!).origin) {
        await route.continue()
        return
      }

      if (url.hostname === 'gallery-fixture.test' && /^\/photo-[12]=w\d+$/.test(url.pathname)) {
        await route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#3C2F75"/></svg>',
        })
        return
      }

      if (url.hostname === 'www.googleapis.com' && url.searchParams.get('key') === 'e2e-api-key') {
        if (url.pathname === '/calendar/v3/colors') {
          await route.fulfill({ json: { event: {} } })
          return
        }
        if (url.pathname === '/calendar/v3/calendars/e2e-calendar/events') {
          await route.fulfill(fixture.calendar === 'error'
            ? { status: 503, json: { error: { message: 'Calendar fixture unavailable' } } }
            : { json: { items: fixture.calendar === 'empty' ? [] : [{
              id: 'e2e-rehearsal',
              summary: 'Fixture rehearsal',
              description: 'slug: fixture-rehearsal\nBring the blue folder.',
              location: 'Choir room',
              start: { dateTime: '2026-06-26T18:30:00+02:00' },
              end: { dateTime: '2026-06-26T19:30:00+02:00' },
            }] } })
          return
        }
        if (url.pathname === '/drive/v3/files') {
          const query = url.searchParams.get('q') ?? ''
          if (query.includes("'e2e-gallery' in parents")) {
            await route.fulfill(fixture.gallery === 'error'
              ? { status: 503, json: { error: { message: 'Gallery fixture unavailable' } } }
              : { json: { files: fixture.gallery === 'empty' ? [] : [album] } })
            return
          }
          if (query.includes("'e2e-album' in parents")) {
            const isCoverRequest = query.includes("name contains '[cover]'")
            if (!isCoverRequest) {
              await photoResponseGate
            }
            await route.fulfill({ json: { files: isCoverRequest ? [photos[0]] : photos } })
            return
          }
        }
        const photo = photos.find((item) => url.pathname === `/drive/v3/files/${item.id}`)
        if (photo) {
          await route.fulfill({ json: photo })
          return
        }
      }

      unexpectedRequests.push(`${route.request().method()} ${url.origin}${url.pathname}`)
      await route.abort('blockedbyclient')
    })

    try {
      await runTest(fixture)
    } finally {
      pendingPhotoResponses.forEach((release) => release())
      await page.unrouteAll({ behavior: 'wait' })
      expect(unexpectedRequests, 'Unexpected requests must not reach live services').toEqual([])
    }
  }, { auto: true }],
})

export { expect } from '@playwright/test'
