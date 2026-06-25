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
  vi.restoreAllMocks()
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
    expect(container.querySelector('.event-details')).toBeNull()

    click(container.querySelector('.event-expand-button'))
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
        <GalleryPage language="en" />
      </>,
    )

    expect(container.textContent).toContain('Scholka Aureolka')
    expect(container.textContent).toContain('Contact')
    expect(container.textContent).toContain('Google Drive gallery is not connected yet.')
    expect(container.querySelector('form')).toBeNull()

    click(container.querySelector('.hero-actions button'))
    expect(container.querySelector('.parent-info-modal')?.textContent).toContain('First steps')
    expect(document.body.style.overflow).toBe('hidden')

    click(container.querySelector('.modal-close'))
    expect(container.querySelector('.parent-info-modal')).toBeNull()
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
    click(container.querySelector('.event-expand-button'))
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
