import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, test, vi } from 'vitest'
import App from '../../src/App'
import { EventList, ImportantNotice } from '../../src/components/EventList'
import {
  AlbumGrid,
  GalleryAlbumHeader,
  GalleryLightbox,
  GalleryStatusMessage,
  PhotoGrid,
} from '../../src/components/Gallery'
import { Footer, Header, PageHeading } from '../../src/components/Layout'
import { ContactPage } from '../../src/pages/ContactPage'
import { FrequencyPage } from '../../src/pages/FrequencyPage'
import { GalleryPage } from '../../src/pages/GalleryPage'
import { HomePage } from '../../src/pages/HomePage'
import { SchedulePage } from '../../src/pages/SchedulePage'
import type { GalleryAlbum, GalleryPhoto, UpcomingEvent } from '../../src/core'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

type RenderedTree = {
  container: HTMLDivElement
  rerender: (element: ReactElement) => void
  root: Root
}

const renderedTrees: RenderedTree[] = []

function render(element: ReactElement): RenderedTree {
  const container = document.createElement('div')
  const root = createRoot(container)
  const renderedTree = {
    container,
    rerender(nextElement: ReactElement) {
      act(() => {
        root.render(nextElement)
      })
    },
    root,
  }

  document.body.append(container)
  act(() => {
    root.render(element)
  })
  renderedTrees.push(renderedTree)

  return renderedTree
}

function click(element: Element | null) {
  if (!element) {
    throw new Error('Element not found')
  }

  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

async function flushAsyncWork(iterations = 1) {
  for (let index = 0; index < iterations; index += 1) {
    await act(async () => {
      await Promise.resolve()
    })
  }
}

async function findElement<T extends Element>(container: Element, selector: string) {
  for (let index = 0; index < 20; index += 1) {
    const element = container.querySelector<T>(selector)

    if (element) {
      return element
    }

    await flushAsyncWork()
  }

  throw new Error(`Element not found: ${selector}`)
}

function setFormValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLSelectElement
    ? HTMLSelectElement.prototype
    : HTMLInputElement.prototype
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  const eventName = element instanceof HTMLSelectElement ? 'change' : 'input'

  act(() => {
    valueSetter?.call(element, value)
    element.dispatchEvent(new Event(eventName, { bubbles: true, cancelable: true }))
  })
}

function keydown(key: string) {
  act(() => {
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
  })
}

function createEvent(overrides: Partial<UpcomingEvent> = {}): UpcomingEvent {
  return {
    date: new Date(2026, 5, 25, 18, 30),
    id: 'event-1',
    location: 'Choir room',
    note: 'Bring water',
    noteBlocks: [{ html: '<strong>Bring water</strong>', kind: 'paragraph', text: 'Bring water' }],
    slug: 'rehearsal',
    source: 'google-calendar',
    title: 'Rehearsal',
    ...overrides,
  }
}

function createAlbum(overrides: Partial<GalleryAlbum> = {}): GalleryAlbum {
  return {
    coverPhoto: createPhoto({ id: 'cover' }),
    date: new Date(2026, 2, 26),
    folderName: '2026-03-26 - Workshop',
    id: 'album-1',
    slug: 'workshop',
    title: { pl: 'Warsztaty', en: 'Workshop' },
    ...overrides,
  }
}

function createPhoto(overrides: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return {
    height: 900,
    id: 'photo-1',
    largeUrl: 'https://example.com/large.jpg',
    name: 'photo.jpg',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    width: 1200,
    ...overrides,
  }
}

function mockFrequencyFetch() {
  const responses = [
    {
      sheets: [
        { properties: { index: 0, title: 'Dane' } },
        { properties: { index: 1, title: '2024' } },
        { properties: { index: 2, title: '2025' } },
        { properties: { index: 3, title: '2026' } },
      ],
    },
    {
      valueRanges: [
        {
          range: 'Dane!A1:C10',
          values: [
            ['id', 'data dołączenia', 'data urodzenia'],
            ['1', '01.01.2026', '01.01.2019'],
            ['2', '01.01.2026', '01.01.2018'],
            ['3', '01.01.2026', '01.01.2017'],
          ],
        },
        {
          range: "'2024'!A1:B10",
          values: [
            ['id', '15.09.2024'],
            ['1', '1'],
            ['2', ''],
            ['3', ''],
          ],
        },
        {
          range: "'2025'!A1:B10",
          values: [
            ['id', '04.09.2025'],
            ['1', '1'],
            ['2', '1'],
            ['3', ''],
          ],
        },
        {
          range: "'2026'!A1:D10",
          values: [
            ['id', '02.04.2026', '26.04.2026', '26.06.2026'],
            ['1', '1', '', ''],
            ['2', '', '1', ''],
            ['3', '', '', '1'],
          ],
        },
      ],
    },
  ]
  const fetchMock = vi.fn(async (input: string | URL) => {
    const response = responses.shift()

    if (!response) {
      throw new Error(`Unexpected fetch: ${String(input)}`)
    }

    return {
      json: async () => response,
      ok: true,
    }
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

afterEach(() => {
  renderedTrees.splice(0).forEach(({ container, root }) => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })
  document.body.style.overflow = ''
  document.body.innerHTML = ''
  window.history.replaceState({}, '', '/')
  window.localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('layout components', () => {
  test('renders header navigation, preferences, and footer credits', () => {
    const setLanguage = vi.fn()
    const setTheme = vi.fn()
    const { container } = render(
      <>
        <Header
          activePage="home"
          language="en"
          setLanguage={setLanguage}
          theme="light"
          setTheme={setTheme}
        />
        <PageHeading page="gallery" language="en" />
        <Footer />
      </>,
    )

    expect(container.querySelector('.brand-link')?.textContent).toContain('Scholka Aureolka')
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('Home')
    expect(container.querySelector('h1')?.textContent).toBe('Gallery')
    expect(container.querySelector('.footer-credits')?.textContent).toContain('Tech stack')

    click(container.querySelector('[aria-label="Open menu"]'))
    expect(container.querySelector('.site-header')?.className).toContain('is-menu-open')

    click(container.querySelector('.segment-button'))
    expect(setLanguage).toHaveBeenCalledWith('pl')

    click(container.querySelector('.theme-switch input'))
    expect(setTheme).toHaveBeenCalledWith('dark')
  })
})

describe('event rendering components', () => {
  test('renders expandable events, attachments, copy controls, and notices', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 24, 10, 0))
    vi.stubEnv('VITE_EVENT_PROGRESS_WINDOW_DAYS', '')

    const onExpandedEventChange = vi.fn()
    const onEventLinkCopy = vi.fn()
    const event = createEvent({
      attachments: [
        {
          id: 'attachment-1',
          title: 'Plan',
          url: 'https://example.com/plan.pdf',
        },
      ],
    })
    const { container, rerender } = render(
      <>
        <ImportantNotice language="en" notices={[createEvent({ id: 'notice', title: 'Notice' })]} />
        <EventList
          events={[event]}
          language="en"
          expandable
          onExpandedEventChange={onExpandedEventChange}
          onEventLinkCopy={onEventLinkCopy}
        />
      </>,
    )

    expect(container.textContent).toContain('Notice')
    expect(container.querySelector('.event-time-chip')?.textContent).toBe('tomorrow')
    expect(
      (container.querySelector('.event-time-chip') as HTMLElement | null)?.style.getPropertyValue(
        '--event-time-progress',
      ),
    ).toBe('81%')
    expect(container.querySelector('.event-details')).toBeNull()
    expect(container.querySelector('.event-expand-button')).toBeNull()

    click(container.querySelector('.event-card-toggle'))
    expect(onExpandedEventChange).toHaveBeenCalledWith('event-1')

    rerender(
      <EventList
        events={[event]}
        language="en"
        expandable
        expandedEventId="event-1"
        onExpandedEventChange={onExpandedEventChange}
        onEventLinkCopy={onEventLinkCopy}
      />,
    )

    expect(container.querySelector('.event-details')?.textContent).toContain('Bring water')
    expect(container.querySelector('.event-card-summary')?.textContent).toContain('Choir room')
    expect(container.querySelector('.event-details')?.textContent).not.toContain('Choir room')
    expect(container.querySelector('.event-attachments')?.textContent).toContain('Plan')

    click(container.querySelector('.event-copy-link-button'))
    expect(onEventLinkCopy).toHaveBeenCalledWith(event)
  })
})

describe('gallery components', () => {
  test('renders album and photo grids with selection callbacks', () => {
    const onAlbumSelect = vi.fn()
    const onPhotoSelect = vi.fn()
    const onBack = vi.fn()
    const album = createAlbum()
    const photo = createPhoto()
    const { container } = render(
      <>
        <GalleryStatusMessage status="loading">Loading</GalleryStatusMessage>
        <AlbumGrid albums={[album]} language="en" onAlbumSelect={onAlbumSelect} />
        <GalleryAlbumHeader album={album} language="en" photoCount={1} onBack={onBack} />
        <PhotoGrid album={album} language="en" photos={[photo]} onPhotoSelect={onPhotoSelect} />
      </>,
    )

    expect(container.textContent).toContain('Loading')
    expect(container.textContent).toContain('Workshop')
    expect(container.textContent).toContain('1 photo')

    click(container.querySelector('.gallery-album-card'))
    expect(onAlbumSelect).toHaveBeenCalledWith('workshop')

    click(container.querySelector('.gallery-back-button'))
    expect(onBack).toHaveBeenCalled()

    click(container.querySelector('.photo-tile'))
    expect(onPhotoSelect).toHaveBeenCalledWith('photo-1')
  })

  test('renders the lightbox and handles keyboard navigation', () => {
    const onClose = vi.fn()
    const onPhotoSelect = vi.fn()
    const album = createAlbum()
    const photos = [createPhoto({ id: 'first' }), createPhoto({ id: 'second' })]
    const { container } = render(
      <GalleryLightbox
        album={album}
        language="en"
        photoId="first"
        photos={photos}
        onClose={onClose}
        onPhotoSelect={onPhotoSelect}
      />,
    )

    expect(document.body.style.overflow).toBe('hidden')
    expect(container.querySelector('.gallery-lightbox')?.textContent).toContain('1 of 2')

    keydown('ArrowRight')
    expect(onPhotoSelect).toHaveBeenCalledWith('second')

    keydown('Escape')
    expect(onClose).toHaveBeenCalled()
  })
})

describe('page components', () => {
  test('renders home modal, contact copy, and gallery unconfigured state', () => {
    vi.stubEnv('VITE_GOOGLE_API_KEY', '')
    vi.stubEnv('VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID', '')

    const { container } = render(
      <>
        <HomePage
          language="en"
          theme="light"
          noticeEvents={[createEvent({ id: 'notice', title: 'Notice' })]}
          upcomingEvents={[createEvent()]}
        />
        <ContactPage language="en" />
        <FrequencyPage language="en" />
        <GalleryPage language="en" />
      </>,
    )

    expect(container.textContent).toContain('Scholka Aureolka')
    expect(container.textContent).toContain('Contact')
    expect(container.textContent).toContain('Attendance sheet is not connected yet.')
    expect(container.textContent).toContain('Google Drive gallery is not connected yet.')
    expect(container.querySelector('.home-upcoming-section')?.textContent).not.toContain(
      'Choir room',
    )
    expect(container.querySelector('form')).toBeNull()

    click(container.querySelector('.hero-actions button'))
    expect(container.querySelector('.parent-info-modal')?.textContent).toContain('First steps')
    expect(document.body.style.overflow).toBe('hidden')

    click(container.querySelector('.modal-close'))
    expect(container.querySelector('.parent-info-modal')).toBeNull()
  })

  test('renders frequency threshold copy, units, age filter behavior, and scroll cues', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 30))
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'api-key')
    vi.stubEnv('VITE_GOOGLE_FREQUENCY_SHEET_ID', 'frequency-sheet')
    const fetchMock = mockFrequencyFetch()
    const { container, rerender } = render(<FrequencyPage language="pl" />)

    const activeWindowInput = await findElement<HTMLInputElement>(
      container,
      '#frequency-active-window',
    )
    const activeWindowField = activeWindowInput.closest('.frequency-filter-field')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(activeWindowInput.value).toBe('2')
    expect(activeWindowField?.textContent).toContain('Próg nieaktywności')
    expect(activeWindowField?.querySelector('.frequency-help')?.getAttribute('aria-label')).toBe(
      'Jak długo przed ostatnim spotkaniem może wypadać ostatnia obecność aktywnego uczestnika.',
    )
    expect(activeWindowField?.querySelector('.frequency-input-with-unit span')?.textContent).toBe(
      'mies.',
    )
    expect(container.querySelectorAll('.frequency-scroll-frame')).toHaveLength(2)
    expect(container.querySelectorAll('.frequency-scroll-cue-left')).toHaveLength(2)
    expect(container.querySelectorAll('.frequency-scroll-cue-right')).toHaveLength(2)

    const periodPreset = container.querySelector<HTMLSelectElement>('#frequency-period')
    const schoolYearStart = container.querySelector<HTMLSelectElement>(
      '#frequency-school-year-start',
    )
    const schoolYearEnd = container.querySelector<HTMLSelectElement>('#frequency-school-year-end')

    if (!periodPreset || !schoolYearStart || !schoolYearEnd) {
      throw new Error('School year filters were not rendered')
    }

    expect(periodPreset.value).toBe('school-year')
    expect(schoolYearStart.value).toBe('2025')
    expect(schoolYearEnd.value).toBe('2025')

    setFormValue(schoolYearStart, '2024')
    expect(periodPreset.value).toBe('school-year')
    expect(schoolYearStart.value).toBe('2024')
    expect(schoolYearEnd.value).toBe('2024')

    setFormValue(schoolYearEnd, '2025')
    expect(periodPreset.value).toBe('custom')
    expect(container.querySelector('#frequency-date-start')).not.toBeNull()
    expect(container.querySelector('#frequency-date-end')).not.toBeNull()

    setFormValue(periodPreset, 'calendar-year')
    const calendarYearStart = container.querySelector<HTMLSelectElement>(
      '#frequency-calendar-year-start',
    )
    const calendarYearEnd = container.querySelector<HTMLSelectElement>('#frequency-calendar-year-end')

    if (!calendarYearStart || !calendarYearEnd) {
      throw new Error('Calendar year filters were not rendered')
    }

    expect(periodPreset.value).toBe('calendar-year')
    expect(calendarYearStart.value).toBe('2026')
    expect(calendarYearEnd.value).toBe('2026')

    setFormValue(calendarYearStart, '2025')
    expect(periodPreset.value).toBe('calendar-year')
    expect(calendarYearStart.value).toBe('2025')
    expect(calendarYearEnd.value).toBe('2025')

    setFormValue(calendarYearEnd, '2026')
    expect(periodPreset.value).toBe('custom')

    const agePreset = container.querySelector<HTMLSelectElement>('#frequency-age-preset')
    const ageStart = container.querySelector<HTMLInputElement>('#frequency-age-start')
    const ageEnd = container.querySelector<HTMLInputElement>('#frequency-age-end')

    if (!agePreset || !ageStart || !ageEnd) {
      throw new Error('Age filters were not rendered')
    }

    setFormValue(ageStart, '8')
    expect(agePreset.value).toBe('age-8')
    expect(ageStart.value).toBe('8')
    expect(ageEnd.value).toBe('8')

    setFormValue(ageEnd, '9')
    expect(agePreset.value).toBe('custom')
    expect(ageStart.value).toBe('8')
    expect(ageEnd.value).toBe('9')

    setFormValue(ageEnd, '7')
    expect(agePreset.value).toBe('age-7')
    expect(ageStart.value).toBe('7')
    expect(ageEnd.value).toBe('7')

    rerender(<FrequencyPage language="en" />)
    expect(activeWindowField?.textContent).toContain('Inactivity threshold')
    expect(activeWindowField?.querySelector('.frequency-help')?.getAttribute('aria-label')).toBe(
      'How long before the latest meeting a member can last attend and still count as active.',
    )
    expect(activeWindowField?.querySelector('.frequency-input-with-unit span')?.textContent).toBe(
      'months',
    )

    setFormValue(activeWindowInput, '1')
    expect(activeWindowField?.querySelector('.frequency-input-with-unit span')?.textContent).toBe(
      'month',
    )
  })

  test('renders schedule states and copies expandable event links', async () => {
    window.history.replaceState({}, '', '/schedule/')
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const event = createEvent()
    const { container } = render(
      <SchedulePage calendarStatus="ready" language="en" upcomingEvents={[event]} />,
    )

    expect(container.textContent).toContain('June 2026')
    expect(container.querySelector('.event-card-summary')?.textContent).toContain('Choir room')
    click(container.querySelector('.event-card-toggle'))
    expect(container.querySelector('.event-details')?.textContent).toContain('Bring water')

    await act(async () => {
      container
        .querySelector('.event-copy-link-button')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/schedule/?event=rehearsal')

    const empty = render(
      <SchedulePage calendarStatus="ready" language="en" upcomingEvents={[]} />,
    )
    expect(empty.container.textContent).toContain('There are no scheduled events')

    const loading = render(
      <SchedulePage calendarStatus="loading" language="en" upcomingEvents={[]} />,
    )
    expect(loading.container.textContent).toContain('Loading current events')
  })

  test('renders the app shell for the current static path', () => {
    window.history.replaceState({}, '', '/contact/')
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    const { container } = render(<App />)

    expect(document.documentElement.lang).toBe('pl')
    expect(container.textContent).toContain('Scholka Aureolka')
    expect(container.querySelector('main')?.textContent).toContain('Kontakt')
  })
})
