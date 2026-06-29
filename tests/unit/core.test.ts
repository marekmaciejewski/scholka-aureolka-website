import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  copyTextToClipboard,
  fetchConfiguredCalendarEvents,
  fetchGoogleDriveAlbumPhotos,
  fetchGoogleDriveGalleryAlbums,
  fetchGoogleDriveThumbnailUrl,
  formatEventDate,
  formatEventRelativeTime,
  formatEventTime,
  formatGalleryAlbumDate,
  formatGalleryPhotoCount,
  formatGalleryPhotoPosition,
  formatGalleryTimelinePhotoDate,
  formatLocalizedHtml,
  getEventCardStyle,
  getEventDomId,
  getEventRelativeProgressWindowDays,
  getEventRelativeTime,
  getEventSlugFromLocation,
  getGalleryAlbumHref,
  getGalleryAlbumSlugFromLocation,
  getGalleryPhotoAlt,
  getGalleryPhotoAspectStyle,
  getGalleryPhotoDisplayTitle,
  getGalleryPhotoHref,
  getGalleryPhotoIdFromLocation,
  getGoogleCalendarConfig,
  getGoogleDriveGalleryConfig,
  getHomeEventHref,
  getInitialLanguage,
  getInitialTheme,
  getLogoForTheme,
  getPageDocumentTitle,
  getPageFromPath,
  groupEventsByMonth,
  isExpandableScheduleEvent,
  replaceScheduleEventUrl,
  splitCalendarEvents,
  translate,
  translateOptional,
  updateGalleryUrl,
  withBasePath,
  type GalleryAlbum,
  type GalleryPhoto,
  type GoogleCalendarConfig,
  type GoogleDriveGalleryConfig,
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

function createAlbum(overrides: Partial<GalleryAlbum> = {}): GalleryAlbum {
  return {
    coverPhoto: undefined,
    date: new Date(2026, 2, 26),
    folderName: '2026-03-26 - Warsztaty -- Workshop',
    id: 'album-1',
    kind: 'standard',
    slug: 'warsztaty-workshop',
    title: { pl: 'Warsztaty', en: 'Workshop' },
    ...overrides,
  }
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
    expect(getPageFromPath('/gallery')).toBe('gallery')
    expect(getPageFromPath('/missing/')).toBe('home')
    expect(getPageDocumentTitle('home', 'en')).toBe('Scholka Aureolka')
    expect(getPageDocumentTitle('gallery', 'en')).toBe('Gallery | Scholka Aureolka')
  })

  test('reads and writes schedule and gallery query-state URLs', () => {
    stubLocation('http://localhost:5173/gallery/?album=Warsztaty 2026&photo=photo-1')

    expect(getGalleryAlbumSlugFromLocation()).toBe('warsztaty-2026')
    expect(getGalleryPhotoIdFromLocation()).toBe('photo-1')

    updateGalleryUrl('cecyliada', 'photo 2')
    expect(window.location.pathname).toBe('/gallery/')
    expect(window.location.search).toBe('?album=cecyliada&photo=photo+2')

    updateGalleryUrl('debeki', null, true)
    expect(window.location.search).toBe('?album=debeki')

    stubLocation('http://localhost:5173/schedule/?event=Proba Grill')
    expect(getEventSlugFromLocation()).toBe('proba-grill')
    replaceScheduleEventUrl('koncert-koled')
    expect(window.location.pathname).toBe('/schedule/')
    expect(window.location.search).toBe('?event=koncert-koled')
    replaceScheduleEventUrl(null)
    expect(window.location.search).toBe('')
  })

  test('handles empty query-state URLs and clipboard availability', async () => {
    stubLocation('http://localhost:5173/gallery/')

    expect(getGalleryAlbumSlugFromLocation()).toBeNull()
    expect(getEventSlugFromLocation()).toBeNull()

    updateGalleryUrl(null, null, true)
    expect(window.location.pathname).toBe('/gallery/')
    expect(window.location.search).toBe('')

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
    vi.stubEnv('VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID', 'gallery-folder')

    expect(getInitialLanguage()).toBe('en')
    expect(getInitialTheme()).toBe('dark')
    expect(getGoogleCalendarConfig()).toEqual({
      apiKey: 'api-key',
      calendars: [{ calendarId: 'main-calendar', source: 'google-calendar' }],
    })
    expect(getGoogleDriveGalleryConfig()).toEqual({
      apiKey: 'api-key',
      folderId: 'gallery-folder',
    })

    vi.stubEnv('VITE_GOOGLE_API_KEY', '')
    vi.stubEnv('VITE_GOOGLE_CALENDAR_ID', '')
    vi.stubEnv('VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID', '')
    stubStorage()
    stubPreferredColorScheme(true)

    expect(getInitialLanguage()).toBe('pl')
    expect(getInitialTheme()).toBe('dark')
    expect(getGoogleCalendarConfig()).toBeNull()
    expect(getGoogleDriveGalleryConfig()).toBeNull()
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
    expect(events[1].isNotice).toBe(true)
    expect(events[1].eventHighlight).toBeUndefined()
  })

  test('maps rich calendar descriptions, all-day events, fallback titles, and invalid items', async () => {
    const config: GoogleCalendarConfig = {
      apiKey: 'api-key',
      calendars: [{ calendarId: 'main-calendar', source: 'google-calendar' }],
    }
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
                <p>EN: <em>Sing</em> <a href="https://example.com/resource"></a><br><u>now</u></p>
                <ol><li>event-slug: rich-html-event</li><li>Bring <s>old</s> notes</li></ol>
                <script>ignored</script><style>.ignored { color: red; }</style>
              </div>
            `,
            id: 'rich',
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
            description: 'Line one\n\nLine two https://example.com/info',
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
      slug: 'rich-html-event',
      title: 'Important choir!',
    })
    expect(richEvent?.attachments?.[0]).toMatchObject({
      iconUrl: undefined,
      mimeType: undefined,
      title: 'Attachment 1',
    })
    expect(richEvent?.noteBlocks?.some((block) => block.kind === 'ordered-list')).toBe(true)
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

describe('gallery helpers', () => {
  test('formats album dates, counts, positions, and alt text', () => {
    const album = createAlbum()

    expect(formatGalleryAlbumDate(album, 'en')).toBe('March 26, 2026')
    expect(formatGalleryAlbumDate(createAlbum({ date: undefined }), 'en')).toBe(
      '2026-03-26 - Warsztaty -- Workshop',
    )
    expect(formatGalleryPhotoCount(1, 'en')).toBe('1 photo')
    expect(formatGalleryPhotoCount(3, 'en')).toBe('3 photos')
    expect(formatGalleryPhotoCount(1, 'pl')).toBe('1 zdjęcie')
    expect(formatGalleryPhotoCount(2, 'pl')).toBe('2 zdjęcia')
    expect(formatGalleryPhotoCount(4, 'pl')).toBe('4 zdjęcia')
    expect(formatGalleryPhotoCount(5, 'pl')).toBe('5 zdjęć')
    expect(formatGalleryPhotoCount(12, 'pl')).toBe('12 zdjęć')
    expect(formatGalleryPhotoCount(22, 'pl')).toBe('22 zdjęcia')
    expect(formatGalleryPhotoCount(25, 'pl')).toBe('25 zdjęć')
    expect(formatGalleryPhotoPosition(1, 3, 'en')).toBe('1 of 3')
    expect(getGalleryPhotoAlt(album, 'en')).toBe('Photo from album Workshop')
  })

  test('builds gallery URLs and photo aspect ratios', () => {
    const photoWithSize: GalleryPhoto = {
      height: 1200,
      id: 'photo 1',
      largeUrl: 'large',
      name: 'photo.jpg',
      thumbnailUrl: 'thumb',
      width: 1600,
    }
    const photoWithoutSize: GalleryPhoto = {
      id: 'photo 2',
      largeUrl: 'large',
      name: 'photo.jpg',
      thumbnailUrl: 'thumb',
    }

    expect(getGalleryAlbumHref('warsztaty-workshop')).toBe('/gallery/?album=warsztaty-workshop')
    expect(getGalleryPhotoHref('warsztaty-workshop', 'photo 1')).toBe(
      '/gallery/?album=warsztaty-workshop&photo=photo%201',
    )
    expect(getGalleryPhotoAspectStyle(photoWithSize)).toEqual({ aspectRatio: '1600 / 1200' })
    expect(getGalleryPhotoAspectStyle(photoWithoutSize)).toBeUndefined()
  })

  test('returns sorted Google Drive albums, covers, photos, and thumbnail refreshes', async () => {
    const config: GoogleDriveGalleryConfig = { apiKey: 'api-key', folderId: 'root-folder' }
    mockJsonFetch([
      {
        files: [
          { id: 'album-old', name: '2025-11-23 - Cecyliada' },
          { id: 'album-new', name: '2026-03-26 - Warsztaty -- Workshop' },
          { id: '', name: 'Missing id' },
        ],
      },
      {
        files: [
          {
            id: 'cover-old',
            imageMediaMetadata: { height: 768, width: 1024 },
            name: '[cover] old.jpg',
            thumbnailLink: 'https://drive/thumb=s220',
          },
        ],
      },
      {
        files: [
          {
            id: 'cover-new',
            imageMediaMetadata: { height: 1200, width: 1600 },
            name: '[cover] new.jpg',
            thumbnailLink: 'https://drive/thumb=s220',
          },
        ],
      },
      {
        files: [
          {
            id: 'photo-1',
            imageMediaMetadata: { height: 900, width: 1200 },
            name: 'photo.jpg',
            thumbnailLink: 'https://drive/photo=w220',
          },
          {
            id: 'bad-photo',
            name: 'missing-thumb.jpg',
          },
        ],
      },
      {
        id: 'photo-1',
        thumbnailLink: 'https://drive/photo=s220-c',
      },
    ])

    const albums = await fetchGoogleDriveGalleryAlbums(config)
    const photos = await fetchGoogleDriveAlbumPhotos(config, albums[0])
    const refreshedThumbnail = await fetchGoogleDriveThumbnailUrl('api-key', 'photo-1', 1800)

    expect(albums.map((album) => album.title.en)).toEqual(['Workshop', 'Cecyliada'])
    expect(albums[0].coverPhoto?.thumbnailUrl).toBe('https://drive/thumb=w720')
    expect(photos).toHaveLength(1)
    expect(photos[0].largeUrl).toBe('https://drive/photo=w1800')
    expect(refreshedThumbnail).toBe('https://drive/photo=w1800')
  })

  test('promotes the achievements album and parses dated timeline photos', async () => {
    const achievementsFolderId = '1regQdvW8Ebx5sGzXQ-4Goffde-ieW1cs'
    const config: GoogleDriveGalleryConfig = { apiKey: 'api-key', folderId: 'root-folder' }
    mockJsonFetch([
      {
        files: [
          { id: 'regular-album', name: '2026-06-01 - Regular Album' },
          { id: achievementsFolderId, name: 'Drive folder title can change' },
        ],
      },
      {
        files: [
          {
            id: 'regular-cover',
            imageMediaMetadata: { height: 768, width: 1024 },
            name: '[cover] regular.jpg',
            thumbnailLink: 'https://drive/regular=s220',
          },
        ],
      },
      {
        files: [
          {
            id: 'undated-diploma',
            imageMediaMetadata: { height: 900, width: 1200 },
            name: 'Dyplom bez daty.jpg',
            thumbnailLink: 'https://drive/undated=s220',
          },
          {
            id: 'old-diploma',
            imageMediaMetadata: { height: 900, width: 1200 },
            name: '2025-11-23 - Konkurs piosenki religijnej -- Religious song contest.jpg',
            thumbnailLink: 'https://drive/old=s220',
          },
          {
            id: 'new-diploma',
            imageMediaMetadata: { height: 900, width: 1200 },
            name: '2026-05-18 - Cecyliada, wyróżnienie -- Cecyliada, distinction.jpg',
            thumbnailLink: 'https://drive/new=s220',
          },
        ],
      },
    ])

    const albums = await fetchGoogleDriveGalleryAlbums(config)
    const photos = await fetchGoogleDriveAlbumPhotos(config, albums[0])

    expect(albums[0]).toMatchObject({
      date: undefined,
      id: achievementsFolderId,
      kind: 'achievements',
      slug: 'achievements',
      title: { pl: 'Osiągnięcia', en: 'Achievements' },
      coverPhoto: undefined,
    })
    expect(albums.map((album) => album.slug)).toEqual([
      'achievements',
      '2026-06-01-regular-album',
    ])
    expect(formatGalleryAlbumDate(albums[0], 'en')).toBe('Contests and festivals')
    expect(photos.map((photo) => getGalleryPhotoDisplayTitle(photo, 'en'))).toEqual([
      'Cecyliada, distinction',
      'Religious song contest',
      'Dyplom bez daty',
    ])
    expect(formatGalleryTimelinePhotoDate(photos[0], 'en')).toBe('May 18, 2026')
    expect(formatGalleryTimelinePhotoDate(photos[2], 'en')).toBe('Undated')
  })

  test('uses Google Drive pagination and falls back to the first album photo as cover', async () => {
    const config: GoogleDriveGalleryConfig = { apiKey: 'api-key', folderId: "root'folder" }
    const fetchMock = mockJsonFetch([
      {
        files: [],
        nextPageToken: 'next-page',
      },
      {
        files: [{ id: 'album-page-2', name: '2026-01-02 - Page Two' }],
      },
      {
        files: [],
      },
      {
        files: [
          {
            id: 'first-photo',
            imageMediaMetadata: { height: 800, width: 1000 },
            name: 'first.jpg',
            thumbnailLink: 'https://drive/first-thumb',
          },
        ],
      },
    ])

    const albums = await fetchGoogleDriveGalleryAlbums(config)

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(String(fetchMock.mock.calls[1][0])).toContain('pageToken=next-page')
    expect(albums).toHaveLength(1)
    expect(albums[0].coverPhoto?.id).toBe('first-photo')
    expect(albums[0].coverPhoto?.thumbnailUrl).toBe('https://drive/first-thumb')
  })

  test('surfaces Google Drive API errors', async () => {
    const config: GoogleDriveGalleryConfig = { apiKey: 'api-key', folderId: 'root-folder' }

    mockJsonFetch([{ body: { error: { message: 'Drive failed' } }, ok: true }])

    await expect(fetchGoogleDriveGalleryAlbums(config)).rejects.toThrow('Drive failed')

    mockJsonFetch([{ body: { error: { message: 'File failed' } }, ok: false }])

    await expect(fetchGoogleDriveThumbnailUrl('api-key', 'photo-1', 720)).rejects.toThrow(
      'File failed',
    )
  })
})
