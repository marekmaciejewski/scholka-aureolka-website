import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  copyTextToClipboard,
  fetchConfiguredCalendarEvents,
  fetchGoogleAchievementsPhotos,
  formatEventDate,
  formatEventRelativeTime,
  formatEventTime,
  formatLocalizedHtml,
  getEventCardStyle,
  getEventDomId,
  getEventRelativeProgressWindowDays,
  getEventRelativeTime,
  getEventSlugFromLocation,
  getGalleryAlbumSlugFromLocation,
  getGalleryPhotoIdFromLocation,
  getGoogleAchievementsConfig,
  getGoogleCalendarConfig,
  getGoogleFrequencyConfig,
  getGoogleSongsConfig,
  getHomeEventHref,
  getInitialLanguage,
  getInitialTheme,
  getLogoForTheme,
  getPageDocumentTitle,
  getPageFromPath,
  getPrivateGalleryUrl,
  getPublicAchievementsAlbum,
  groupEventsByMonth,
  isExpandableScheduleEvent,
  replaceScheduleEventUrl,
  splitCalendarEvents,
  translate,
  translateOptional,
  updateGalleryUrl,
  withBasePath,
  type GoogleCalendarConfig,
  type GoogleAchievementsConfig,
  type UpcomingEvent,
} from '../../src/core'

function stubLocation(url: string) {
  const nextUrl = new URL(url)

  window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
}

function stubStorage(values: Record<string, string | null> = {}) {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => values[key] ?? null),
    setItem: vi.fn(),
  })
}

function stubPreferredColorScheme(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches })))
}

function createEvent(overrides: Partial<UpcomingEvent> = {}): UpcomingEvent {
  return {
    date: new Date(2026, 5, 25, 18, 30),
    id: 'event 1',
    source: 'google-calendar',
    title: 'Proba',
    ...overrides,
  }
}

function getCalendarBlocksHtml(blocks: UpcomingEvent['noteBlocks']) {
  return (
    blocks
      ?.map((block) => {
        if (block.kind === 'paragraph') {
          return block.html
        }

        if (block.kind === 'ordered-list' || block.kind === 'unordered-list') {
          return block.items.map((item) => item.html).join(' ')
        }

        return ''
      })
      .join(' ') ?? ''
  )
}

type MockJsonFetchResponse = {
  body: unknown
  ok?: boolean
}

function isMockJsonFetchResponse(response: unknown): response is MockJsonFetchResponse {
  return Boolean(response && typeof response === 'object' && 'body' in response)
}

function mockJsonFetch(responses: Array<MockJsonFetchResponse | unknown>) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const response = responses.shift()

    if (!response) {
      throw new Error(`Unexpected fetch: ${String(input)}`)
    }
    const body = isMockJsonFetchResponse(response) ? response.body : response
    const ok = isMockJsonFetchResponse(response) ? (response.ok ?? true) : true

    return {
      json: async () => body,
      ok,
    }
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('routing and page helpers', () => {
  test('keeps external, hash, and local paths distinct when applying the base path', () => {
    expect(withBasePath('/schedule/')).toBe('/schedule/')
    expect(withBasePath('gallery/')).toBe('/gallery/')
    expect(withBasePath('#main-content')).toBe('#main-content')
    expect(withBasePath('https://example.com')).toBe('https://example.com')
  })

  test('resolves static page keys and document titles', () => {
    expect(getPageFromPath('/')).toBe('home')
    expect(getPageFromPath('/schedule/')).toBe('schedule')
    expect(getPageFromPath('/songs/')).toBe('songs')
    expect(getPageFromPath('/gallery')).toBe('gallery')
    expect(getPageFromPath('/frequency/')).toBe('frequency')
    expect(getPageFromPath('/missing/')).toBe('home')
    expect(getPageDocumentTitle('home', 'en')).toBe('Scholka Aureolka')
    expect(getPageDocumentTitle('gallery', 'en')).toBe('Gallery | Scholka Aureolka')
    expect(getPageDocumentTitle('songs', 'en')).toBe('Songs | Scholka Aureolka')
    expect(getPageDocumentTitle('frequency', 'en')).toBe('Attendance | Scholka Aureolka')
  })

  test('reads and writes schedule query-state URLs', () => {
    stubLocation('http://localhost:5173/schedule/?event=Proba Grill')
    expect(getEventSlugFromLocation()).toBe('proba-grill')
    replaceScheduleEventUrl('koncert-koled')
    expect(window.location.pathname).toBe('/schedule/')
    expect(window.location.search).toBe('?event=koncert-koled')
    replaceScheduleEventUrl(null)
    expect(window.location.search).toBe('')
  })

  test('handles empty query-state URLs and clipboard availability', async () => {
    stubLocation('http://localhost:5173/schedule/')

    expect(getEventSlugFromLocation()).toBeNull()

    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await copyTextToClipboard('event link')

    expect(writeText).toHaveBeenCalledWith('event link')

    vi.stubGlobal('navigator', {})

    await expect(copyTextToClipboard('event link')).rejects.toThrow('Clipboard API is unavailable')
  })

  test('reads persisted language, theme, and Google API config with safe fallbacks', () => {
    stubStorage({
      'scholka-aureolka-language': 'en',
      'scholka-aureolka-theme': 'dark',
    })
    stubPreferredColorScheme(false)
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'api-key')
    vi.stubEnv('VITE_GOOGLE_CALENDAR_ID', 'main-calendar')
    vi.stubEnv('VITE_PRIVATE_GALLERY_URL', 'https://sites.google.com/view/private-gallery')
    vi.stubEnv('VITE_GOOGLE_FREQUENCY_SHEET_ID', 'frequency-sheet')
    vi.stubEnv('VITE_GOOGLE_SONGS_SHEET_ID', 'songs-sheet')

    expect(getInitialLanguage()).toBe('en')
    expect(getInitialTheme()).toBe('dark')
    expect(getGoogleCalendarConfig()).toEqual({
      apiKey: 'api-key',
      calendars: [{ calendarId: 'main-calendar', source: 'google-calendar' }],
    })
    expect(getPrivateGalleryUrl()).toBe('https://sites.google.com/view/private-gallery')
    expect(getGoogleAchievementsConfig()).toEqual({
      apiKey: 'api-key',
      folderId: getPublicAchievementsAlbum().id,
    })
    expect(getGoogleFrequencyConfig()).toEqual({
      apiKey: 'api-key',
      spreadsheetId: 'frequency-sheet',
    })
    expect(getGoogleSongsConfig()).toEqual({
      apiKey: 'api-key',
      spreadsheetId: 'songs-sheet',
    })

    vi.stubEnv('VITE_GOOGLE_API_KEY', '')
    vi.stubEnv('VITE_GOOGLE_CALENDAR_ID', '')
    vi.stubEnv('VITE_PRIVATE_GALLERY_URL', '')
    vi.stubEnv('VITE_GOOGLE_FREQUENCY_SHEET_ID', '')
    vi.stubEnv('VITE_GOOGLE_SONGS_SHEET_ID', '')
    stubStorage()
    stubPreferredColorScheme(true)

    expect(getInitialLanguage()).toBe('pl')
    expect(getInitialTheme()).toBe('dark')
    expect(getGoogleCalendarConfig()).toBeNull()
    expect(getPrivateGalleryUrl()).toBeNull()
    expect(getGoogleAchievementsConfig()).toBeNull()
    expect(getGoogleFrequencyConfig()).toBeNull()
    expect(getGoogleSongsConfig()).toBeNull()
  })

  test('reads and writes only the public Achievements gallery route', () => {
    stubLocation('http://localhost:5173/gallery/?album=achievements&photo=diploma-1')
    expect(getGalleryAlbumSlugFromLocation()).toBe('achievements')
    expect(getGalleryPhotoIdFromLocation()).toBe('diploma-1')

    updateGalleryUrl(true, 'diploma-2')
    expect(window.location.pathname).toBe('/gallery/')
    expect(window.location.search).toBe('?album=achievements&photo=diploma-2')

    updateGalleryUrl(false, null)
    expect(window.location.search).toBe('')

    stubLocation('http://localhost:5173/gallery/?album=children')
    expect(getGalleryAlbumSlugFromLocation()).toBeNull()
  })
})

describe('public Achievements integration', () => {
  test('loads and sorts only images from the fixed public folder', async () => {
    const album = getPublicAchievementsAlbum()
    const config: GoogleAchievementsConfig = { apiKey: 'api-key', folderId: album.id }
    const fetchMock = mockJsonFetch([
      {
        files: [
          {
            id: 'older',
            name: '2025-11-22 - Złoty Dyplom -- Golden Diploma.jpg',
            thumbnailLink: 'https://example.com/older=s220',
            imageMediaMetadata: { width: 1200, height: 800 },
          },
          {
            id: 'newer',
            name: '2026-05-18 - Wyróżnienie -- Distinction [cover].jpg',
            thumbnailLink: 'https://example.com/newer=s220',
            imageMediaMetadata: { width: 800, height: 1200 },
          },
        ],
      },
    ])

    const photos = await fetchGoogleAchievementsPhotos(config)

    expect(fetchMock).toHaveBeenCalledOnce()
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]))
    expect(requestedUrl.pathname).toBe('/drive/v3/files')
    expect(requestedUrl.searchParams.get('q')).toContain(`'${album.id}' in parents`)
    expect(requestedUrl.searchParams.get('q')).toContain("mimeType contains 'image/'")
    expect(photos.map((photo) => photo.id)).toEqual(['newer', 'older'])
    expect(photos[0].title).toEqual({ pl: 'Wyróżnienie', en: 'Distinction' })
    expect(photos[0].thumbnailUrl).toBe('https://example.com/newer=w720')
    expect(photos[0].largeUrl).toBe('https://example.com/newer=w1800')
  })

  test('rejects any attempt to point the Achievements loader at another folder', async () => {
    await expect(
      fetchGoogleAchievementsPhotos({ apiKey: 'api-key', folderId: 'another-folder' }),
    ).rejects.toThrow('Unexpected achievements folder')
  })
})

describe('translation and formatting helpers', () => {
  test('translates plain and optional localized text', () => {
    expect(translate({ pl: 'Start', en: 'Home' }, 'en')).toBe('Home')
    expect(translateOptional('Scholka Aureolka', 'pl')).toBe('Scholka Aureolka')
  })

  test('adds Polish non-breaking spaces without touching html tags', () => {
    expect(formatLocalizedHtml('Idziemy w <strong>procesji</strong> i spiewamy', 'pl')).toBe(
      'Idziemy w <strong>procesji</strong> i\u00a0spiewamy',
    )
    expect(formatLocalizedHtml('Idziemy <strong', 'pl')).toBe('Idziemy <strong')
    expect(formatLocalizedHtml('We sing and pray', 'en')).toBe('We sing and pray')
  })

  test('selects the right logo variants for theme and surface', () => {
    expect(getLogoForTheme('light', 'header')).toContain('Logo1')
    expect(getLogoForTheme('dark', 'header')).toContain('Logo2')
    expect(getLogoForTheme('light', 'purple')).toContain('Logo5')
    expect(getLogoForTheme('dark', 'purple')).toContain('Logo6')
  })
})

describe('schedule helpers', () => {
  test('formats event dates and times by language', () => {
    const date = new Date(2026, 5, 25, 18, 30)

    expect(formatEventDate(date, 'en')).toContain('June')
    expect(formatEventTime(date, 'en')).toMatch(/6:30|06:30/)
    expect(formatEventDate(date, 'pl')).toMatch(/czerwca|cze/)
  })

  test('formats event relative time chips by language', () => {
    const referenceDate = new Date(2026, 5, 25, 8, 0)

    expect(formatEventRelativeTime(new Date(2026, 5, 25, 18, 30), 'pl', referenceDate)).toBe(
      'dzi\u015b',
    )
    expect(formatEventRelativeTime(new Date(2026, 5, 26, 18, 30), 'en', referenceDate)).toBe(
      'tomorrow',
    )
    expect(formatEventRelativeTime(new Date(2026, 5, 29, 18, 30), 'pl', referenceDate)).toBe(
      'za 4 dni',
    )
    expect(formatEventRelativeTime(new Date(2026, 6, 9, 18, 30), 'en', referenceDate)).toBe(
      'in 2 weeks',
    )
    expect(formatEventRelativeTime(new Date(2026, 8, 17, 18, 30), 'pl', referenceDate)).toBe(
      'za 3 mies.',
    )
    expect(formatEventRelativeTime(new Date(2026, 5, 24, 18, 30), 'en', referenceDate)).toBeNull()
  })

  test('calculates event relative time progress over the final week', () => {
    const referenceDate = new Date(2026, 5, 25, 8, 0)
    vi.stubEnv('VITE_EVENT_PROGRESS_WINDOW_DAYS', '')

    expect(
      getEventRelativeTime(new Date(2026, 6, 2, 8, 0), 'pl', referenceDate)?.progressPercent,
    ).toBe(0)
    expect(
      getEventRelativeTime(new Date(2026, 5, 28, 8, 0), 'pl', referenceDate)?.progressPercent,
    ).toBe(57)
    expect(
      getEventRelativeTime(new Date(2026, 5, 25, 20, 0), 'pl', referenceDate)?.progressPercent,
    ).toBe(93)
    expect(
      getEventRelativeTime(new Date(2026, 5, 25, 8, 0), 'pl', referenceDate)?.progressPercent,
    ).toBe(100)
  })

  test('uses a configured event progress window with safe fallback', () => {
    const referenceDate = new Date(2026, 5, 25, 8, 0)

    vi.stubEnv('VITE_EVENT_PROGRESS_WINDOW_DAYS', '14')
    expect(getEventRelativeProgressWindowDays()).toBe(14)
    expect(
      getEventRelativeTime(new Date(2026, 6, 2, 8, 0), 'pl', referenceDate)?.progressPercent,
    ).toBe(50)

    vi.stubEnv('VITE_EVENT_PROGRESS_WINDOW_DAYS', '0')
    expect(getEventRelativeProgressWindowDays()).toBe(7)

    vi.stubEnv('VITE_EVENT_PROGRESS_WINDOW_DAYS', 'soon')
    expect(getEventRelativeProgressWindowDays()).toBe(7)
  })

  test('detects expandable events and derives home links', () => {
    stubLocation('http://localhost:5173/')

    const expandableEvent = createEvent({ note: 'Details', slug: 'proba-grill' })
    const birthdayEvent = createEvent({
      eventHighlight: { accent: 'var(--color-violet)', kind: 'birthday' },
      note: 'Birthday',
      slug: 'birthday',
    })

    expect(isExpandableScheduleEvent(expandableEvent)).toBe(true)
    expect(isExpandableScheduleEvent(birthdayEvent)).toBe(false)
    expect(getHomeEventHref(expandableEvent)).toBe('/schedule/?event=proba-grill')
    expect(getHomeEventHref(createEvent())).toBe('/schedule/')
  })

  test('builds safe dom ids and event card accent styles', () => {
    expect(getEventDomId(createEvent({ id: 'google/event:1' }))).toBe('event-google-event-1')
    expect(getEventDomId(createEvent({ slug: 'proba-grill' }))).toBe('event-proba-grill')
    expect(getEventCardStyle(createEvent())).toBeUndefined()
    expect(
      getEventCardStyle(createEvent({ eventHighlight: { accent: '#c1121f', kind: 'important' } })),
    ).toEqual({ '--event-accent': '#c1121f' })
  })

  test('splits notices and groups schedule events by month', () => {
    const notice = createEvent({ id: 'notice', isNotice: true, title: 'Notice' })
    const juneEvent = createEvent({ id: 'june' })
    const julyEvent = createEvent({ date: new Date(2026, 6, 2, 18, 30), id: 'july' })

    expect(splitCalendarEvents([notice, juneEvent])).toEqual({
      noticeEvents: [notice],
      scheduleEvents: [juneEvent],
    })
    expect(groupEventsByMonth([juneEvent, julyEvent], 'en').map((group) => group.month)).toEqual([
      'June 2026',
      'July 2026',
    ])
  })

  test('maps configured Google Calendar events, notices, colors, and attachments', async () => {
    const config: GoogleCalendarConfig = {
      apiKey: 'api-key',
      calendars: [{ calendarId: 'main-calendar', source: 'google-calendar' }],
    }
    const fetchMock = mockJsonFetch([
      {
        event: {
          '1': { background: '#123456', foreground: '#ffffff' },
          invalid: { background: 'blue' },
        },
      },
      {
        items: [
          {
            attachments: [
              {
                fileId: 'file-1',
                fileUrl: 'https://example.com/file.pdf',
                iconLink: 'https://example.com/icon.png',
                mimeType: 'application/pdf',
                title: 'Plan',
              },
              { fileUrl: 'javascript:alert(1)', title: 'Bad' },
            ],
            colorId: '1',
            description:
              'slug: proba-grill\nPL:\n<strong>Proba</strong> przy grillu\n\nEN:\n<strong>Rehearsal</strong> by the grill',
            end: { dateTime: '2026-06-25T19:30:00+02:00' },
            id: 'event-1',
            location: 'Room',
            start: { dateTime: '2026-06-25T18:30:00+02:00' },
            summary: 'Rehearsal - grill',
          },
          {
            description: 'Bring water',
            id: 'notice-1',
            start: { date: '2026-06-26' },
            summary: '[notice] !Grill!',
          },
          {
            id: 'cancelled-1',
            start: { date: '2026-06-27' },
            status: 'cancelled',
            summary: 'Cancelled',
          },
        ],
      },
    ])

    const events = await fetchConfiguredCalendarEvents(config, 'en')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(events.map((event) => event.title)).toEqual(['Rehearsal - grill', '!Grill!'])
    expect(events[0]).toMatchObject({
      attachments: [
        {
          iconUrl: 'https://example.com/icon.png',
          id: 'file-1',
          title: 'Plan',
          url: 'https://example.com/file.pdf',
        },
      ],
      eventColor: { background: '#123456', foreground: '#ffffff' },
      location: 'Room',
      slug: 'proba-grill',
    })
    expect(getCalendarBlocksHtml(events[0].locationBlocks)).not.toContain('<a ')
    expect(events[1].isNotice).toBe(true)
    expect(events[1].eventHighlight).toBeUndefined()
  })

  test('maps rich calendar descriptions, all-day events, fallback titles, and invalid items', async () => {
    const config: GoogleCalendarConfig = {
      apiKey: 'api-key',
      calendars: [{ calendarId: 'main-calendar', source: 'google-calendar' }],
    }
    const localGalleryHref = `${globalThis.location.origin}/gallery/`
    const localScheduleHref = `${globalThis.location.origin}/schedule/`
    const localContactHref = `${globalThis.location.origin}/contact/`

    mockJsonFetch([
      {
        event: {
          '2': { background: '#abcdef', foreground: 'not-a-color' },
        },
      },
      {
        items: [
          {
            attachments: [
              { fileUrl: '/file.pdf', title: '   ', mimeType: '   ', iconLink: 'ftp://bad' },
              { fileUrl: 'https://example.com/guide.pdf' },
            ],
            colorId: '2',
            description: `
              <div>
                <p>EN: <em>Sing</em> <a href="https://example.com/resource"></a> <a href="${localGalleryHref}">site album</a> <a href="/contact/">contact</a><br><u>now</u></p>
                <ol><li>event-slug: rich-html-event</li><li>Bring <s>old</s> notes</li></ol>
                <script>ignored</script><style>.ignored { color: red; }</style>
              </div>
            `,
            id: 'rich',
            location: 'https://maps.app.goo.gl/rich-event',
            start: { date: '2026-07-02' },
            summary: '!Important choir!',
          },
          {
            id: 'missing-start',
            summary: 'Missing start',
          },
          {
            id: 'bad-date',
            start: { date: 'bad-date' },
            summary: 'Bad date',
          },
          {
            description:
              `Line one ${localScheduleHref}\n\nLine two https://example.com/info`,
            iCalUID: 'fallback-uid',
            start: { dateTime: '2026-07-03T10:00:00+02:00' },
            summary: '   ',
          },
          {
            id: 'birthday-keyword',
            start: { dateTime: '2026-07-04T10:00:00+02:00' },
            summary: 'Birthday party',
          },
        ],
      },
    ])

    const events = await fetchConfiguredCalendarEvents(config, 'en')
    const richEvent = events.find((event) => event.id.endsWith('rich'))
    const fallbackTitleEvent = events.find((event) => event.id.endsWith('fallback-uid'))
    const birthdayEvent = events.find((event) => event.id.endsWith('birthday-keyword'))

    expect(events).toHaveLength(3)
    expect(richEvent).toMatchObject({
      eventColor: { background: '#abcdef', foreground: undefined },
      isAllDay: true,
      location: 'https://maps.app.goo.gl/rich-event',
      slug: 'rich-html-event',
      title: 'Important choir!',
    })
    expect(richEvent?.attachments?.[0]).toMatchObject({
      iconUrl: undefined,
      mimeType: undefined,
      title: 'Attachment 1',
    })
    expect(richEvent?.noteBlocks?.some((block) => block.kind === 'ordered-list')).toBe(true)
    const richCalendarHtml = getCalendarBlocksHtml(richEvent?.noteBlocks)
    const plainTextCalendarHtml = getCalendarBlocksHtml(fallbackTitleEvent?.noteBlocks)

    expect(richCalendarHtml).toContain(
      '<a href="https://example.com/resource" target="_blank" rel="noreferrer">https://example.com/resource</a>',
    )
    expect(richCalendarHtml).toContain(`<a href="${localGalleryHref}">site album</a>`)
    expect(richCalendarHtml).toContain(`<a href="${localContactHref}">contact</a>`)
    expect(richCalendarHtml).not.toContain(`href="${localGalleryHref}" target=`)
    expect(richCalendarHtml).not.toContain(`href="${localContactHref}" target=`)
    expect(plainTextCalendarHtml).toContain(
      `<a href="${localScheduleHref}">${localScheduleHref}</a>`,
    )
    expect(plainTextCalendarHtml).toContain(
      '<a href="https://example.com/info" target="_blank" rel="noreferrer">https://example.com/info</a>',
    )
    expect(getCalendarBlocksHtml(richEvent?.locationBlocks)).toContain(
      '<a href="https://maps.app.goo.gl/rich-event" target="_blank" rel="noreferrer">https://maps.app.goo.gl/rich-event</a>',
    )
    expect(fallbackTitleEvent?.title).toBe('Event')
    expect(fallbackTitleEvent?.slug).toContain('event')
    expect(fallbackTitleEvent?.noteBlocks?.some((block) => block.kind === 'spacer')).toBe(true)
    expect(birthdayEvent?.eventHighlight?.kind).toBe('birthday')
  })

  test('throws when all configured calendar requests fail', async () => {
    const config: GoogleCalendarConfig = {
      apiKey: 'api-key',
      calendars: [{ calendarId: 'main-calendar', source: 'google-calendar' }],
    }
    mockJsonFetch([
      { body: { error: { message: 'Colors unavailable' } }, ok: false },
      { body: { error: { message: 'Calendar unavailable' } }, ok: false },
    ])

    await expect(fetchConfiguredCalendarEvents(config, 'en')).rejects.toThrow(
      'Google Calendar requests failed',
    )
  })
})
