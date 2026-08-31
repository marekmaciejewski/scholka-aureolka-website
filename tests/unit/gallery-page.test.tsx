import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { AchievementsTimeline } from '../../src/components/Gallery'
import { getPublicAchievementsAlbum, type GalleryPhoto } from '../../src/core'
import { GalleryPage } from '../../src/pages/GalleryPage'

const roots: Root[] = []

function render(element: ReactElement) {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => root.render(element))
  roots.push(root)

  return container
}

function normalizedText(container: HTMLElement) {
  return container.textContent?.replace(/\s+/g, ' ')
}

afterEach(() => {
  roots.splice(0).forEach((root) => act(() => root.unmount()))
  document.body.replaceChildren()
  window.history.replaceState({}, '', '/gallery/')
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('private gallery landing page', () => {
  test('opens the configured restricted Google Site from the English page', () => {
    vi.stubEnv('VITE_PRIVATE_GALLERY_URL', 'https://sites.google.com/view/scholka-private/')

    const container = render(<GalleryPage language="en" />)
    const link = container.querySelector<HTMLAnchorElement>('.private-gallery-button')

    expect(container.textContent).toContain('The gallery is private')
    expect(container.textContent).toContain('approved accounts')
    expect(container.textContent).toContain("Let's protect children's privacy")
    expect(container.textContent).not.toContain('The gallery opens in a new tab')
    expect(container.textContent).not.toContain('This album contains no photos of children')
    expect(container.textContent).not.toContain('Open album')
    expect(
      container.querySelector('.private-gallery-card .private-gallery-privacy-note'),
    ).not.toBeNull()
    expect(link?.textContent).toContain('Open private gallery')
    expect(link?.href).toBe('https://sites.google.com/view/scholka-private/')
    expect(link?.target).toBe('_blank')
    expect(link?.rel).toBe('noreferrer')
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('Achievements')
    expect(container.querySelector('.achievement-certificate')).not.toBeNull()
    expect(container.querySelector<HTMLAnchorElement>('.achievements-card-featured')?.href).toBe(
      'http://localhost:3000/gallery/?album=achievements',
    )
  })

  test('renders complete Polish copy', () => {
    vi.stubEnv('VITE_PRIVATE_GALLERY_URL', 'https://sites.google.com/view/scholka-private/')

    const container = render(<GalleryPage language="pl" />)

    const text = normalizedText(container)

    expect(text).toContain('Galeria jest prywatna')
    expect(text).toContain('Otwórz prywatną galerię')
    expect(text).toContain('Dbajmy o prywatność dzieci')
  })

  test.each([
    ['', 'missing'],
    ['http://sites.google.com/view/insecure', 'insecure'],
    ['https://example.com/not-google-sites', 'unexpected host'],
    ['not a URL', 'malformed'],
  ])('does not render a link for %s configuration (%s)', (configuredUrl) => {
    vi.stubEnv('VITE_PRIVATE_GALLERY_URL', configuredUrl)

    const container = render(<GalleryPage language="en" />)

    expect(container.querySelector('.private-gallery-button')).toBeNull()
    expect(container.textContent).toContain('The private gallery is being prepared.')
  })

  test('opens the on-site Achievements album and keeps the private card separate', () => {
    vi.stubEnv('VITE_GOOGLE_API_KEY', '')
    const container = render(<GalleryPage language="en" />)
    const achievementsCard = container.querySelector<HTMLAnchorElement>(
      '.achievements-card-featured',
    )

    act(() =>
      achievementsCard?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    )

    expect(window.location.search).toBe('?album=achievements')
    expect(container.textContent).toContain('Contests and festivals')
    expect(container.textContent).toContain('The public Achievements album is not connected yet.')
    expect(container.querySelector('.private-gallery-card')).toBeNull()
  })
})

describe('Achievements timeline', () => {
  test('groups dated photos and opens the legacy on-site photo viewer route', () => {
    const photos: GalleryPhoto[] = [
      {
        id: 'new-diploma',
        name: '2026-05-18 - Cecyliada, wyróżnienie -- Cecyliada, distinction.jpg',
        title: { pl: 'Cecyliada, wyróżnienie', en: 'Cecyliada, distinction' },
        date: new Date(2026, 4, 18),
        thumbnailUrl: 'https://example.com/new.jpg',
        largeUrl: 'https://example.com/new-large.jpg',
      },
      {
        id: 'gold-diploma',
        name: '2025-11-22 - Cecyliada, Złoty Dyplom -- Cecyliada, Golden Diploma.jpg',
        title: { pl: 'Cecyliada, Złoty Dyplom', en: 'Cecyliada, Golden Diploma' },
        date: new Date(2025, 10, 22),
        thumbnailUrl: 'https://example.com/gold.jpg',
        largeUrl: 'https://example.com/gold-large.jpg',
      },
    ]
    const onPhotoSelect = vi.fn()
    const container = render(
      <AchievementsTimeline
        album={getPublicAchievementsAlbum()}
        language="en"
        photos={photos}
        onPhotoSelect={onPhotoSelect}
      />,
    )

    expect(container.querySelector('.achievements-timeline')).not.toBeNull()
    expect(container.textContent).toContain('May 18, 2026')
    expect(container.textContent).toContain('Cecyliada, distinction')
    expect(container.querySelectorAll('.achievement-grid')).toHaveLength(2)

    const firstPhoto = container.querySelector<HTMLAnchorElement>('.achievement-card')
    expect(firstPhoto?.href).toContain('album=achievements&photo=new-diploma')
    act(() =>
      firstPhoto?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    )
    expect(onPhotoSelect).toHaveBeenCalledWith('new-diploma')
  })
})
