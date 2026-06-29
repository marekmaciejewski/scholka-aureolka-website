import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const coreMocks = vi.hoisted(() => ({
  fetchGoogleDriveAlbumPhotos: vi.fn(),
  fetchGoogleDriveGalleryAlbums: vi.fn(),
  fetchGoogleDriveThumbnailUrl: vi.fn(),
  getGoogleDriveGalleryConfig: vi.fn(),
}))

vi.mock('../../src/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core')>()

  return {
    ...actual,
    fetchGoogleDriveAlbumPhotos: coreMocks.fetchGoogleDriveAlbumPhotos,
    fetchGoogleDriveGalleryAlbums: coreMocks.fetchGoogleDriveGalleryAlbums,
    fetchGoogleDriveThumbnailUrl: coreMocks.fetchGoogleDriveThumbnailUrl,
    getGoogleDriveGalleryConfig: coreMocks.getGoogleDriveGalleryConfig,
  }
})

import { AlbumGrid, GalleryLightbox, PhotoGrid } from '../../src/components/Gallery'
import {
  galleryImageLogoSpinnerMinimumMs,
  galleryImageRetryDelays,
  type GalleryAlbum,
  type GalleryPhoto,
  type GoogleDriveGalleryConfig,
} from '../../src/core'
import { GalleryPage } from '../../src/pages/GalleryPage'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

type RenderedTree = {
  container: HTMLDivElement
  root: Root
}

const galleryConfig: GoogleDriveGalleryConfig = {
  apiKey: 'gallery-api-key',
  folderId: 'gallery-folder',
}
const renderedTrees: RenderedTree[] = []

function render(element: ReactElement): RenderedTree {
  const container = document.createElement('div')
  const root = createRoot(container)
  const renderedTree = { container, root }

  document.body.append(container)
  act(() => {
    root.render(element)
  })
  renderedTrees.push(renderedTree)

  return renderedTree
}

function cleanupTree(renderedTree: RenderedTree) {
  const index = renderedTrees.indexOf(renderedTree)

  if (index >= 0) {
    renderedTrees.splice(index, 1)
  }

  act(() => {
    renderedTree.root.unmount()
  })
  renderedTree.container.remove()
}

async function flushEffects(cycles = 4) {
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    await act(async () => {
      await Promise.resolve()
    })
  }
}

function click(element: Element | null) {
  if (!element) {
    throw new Error('Element not found')
  }

  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

function dispatchImageEvent(image: HTMLImageElement, eventName: 'error' | 'load') {
  act(() => {
    image.dispatchEvent(new Event(eventName, { bubbles: true, cancelable: true }))
  })
}

function getGalleryImage(container: HTMLElement) {
  const image = container.querySelector<HTMLImageElement>('.gallery-image > img')

  if (!image) {
    throw new Error('Gallery image not found')
  }

  return image
}

function getGalleryImageFrame(container: HTMLElement) {
  const frame = container.querySelector('.gallery-image')

  if (!frame) {
    throw new Error('Gallery image frame not found')
  }

  return frame
}

function setNaturalWidth(image: HTMLImageElement, naturalWidth: number) {
  Object.defineProperty(image, 'naturalWidth', {
    configurable: true,
    value: naturalWidth,
  })
}

function setNaturalSize(image: HTMLImageElement, naturalWidth: number, naturalHeight: number) {
  Object.defineProperty(image, 'naturalWidth', {
    configurable: true,
    value: naturalWidth,
  })
  Object.defineProperty(image, 'naturalHeight', {
    configurable: true,
    value: naturalHeight,
  })
}

function createAlbum(overrides: Partial<GalleryAlbum> = {}): GalleryAlbum {
  return {
    coverPhoto: createPhoto({ id: 'cover-photo' }),
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

beforeEach(() => {
  coreMocks.getGoogleDriveGalleryConfig.mockReturnValue(galleryConfig)
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  renderedTrees.splice(0).forEach(cleanupTree)
  document.body.style.overflow = ''
  document.body.innerHTML = ''
  window.history.replaceState({}, '', '/')
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Object.values(coreMocks).forEach((mock) => mock.mockReset())
})

describe('gallery page data states', () => {
  test('loads albums, opens photos, and keeps gallery state in the URL', async () => {
    const album = createAlbum()
    const photos = [
      createPhoto({ id: 'photo-1' }),
      createPhoto({
        id: 'photo-2',
        largeUrl: 'https://example.com/second-large.jpg',
        thumbnailUrl: 'https://example.com/second-thumb.jpg',
      }),
    ]
    let resolvePhotos: (nextPhotos: GalleryPhoto[]) => void = () => undefined

    coreMocks.fetchGoogleDriveGalleryAlbums.mockResolvedValue([album])
    coreMocks.fetchGoogleDriveAlbumPhotos.mockReturnValue(
      new Promise<GalleryPhoto[]>((resolve) => {
        resolvePhotos = resolve
      }),
    )

    const { container } = render(<GalleryPage language="en" />)

    expect(container.textContent).toContain('Loading albums from Google Drive.')

    await flushEffects()

    expect(coreMocks.fetchGoogleDriveGalleryAlbums).toHaveBeenCalledWith(galleryConfig)
    expect(container.textContent).toContain('Workshop')

    click(container.querySelector('.gallery-album-card'))
    await flushEffects(2)

    expect(globalThis.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
    expect(coreMocks.fetchGoogleDriveAlbumPhotos).toHaveBeenCalledWith(galleryConfig, album)
    expect(container.textContent).toContain('Loading photos from the album.')

    await act(async () => {
      resolvePhotos(photos)
      await Promise.resolve()
    })
    await flushEffects()

    expect(container.textContent).toContain('2 photos')

    click(container.querySelector('.photo-tile'))
    expect(window.location.search).toContain('album=workshop')
    expect(window.location.search).toContain('photo=photo-1')
    expect(container.textContent).toContain('1 of 2')

    act(() => {
      window.history.pushState({}, '', '/gallery/?album=workshop&photo=photo-2')
      globalThis.dispatchEvent(new Event('popstate'))
    })

    expect(container.textContent).toContain('2 of 2')

    click(container.querySelector('.gallery-lightbox-nav.previous'))
    expect(window.location.search).toContain('photo=photo-1')

    click(container.querySelector('.gallery-lightbox-bar .gallery-lightbox-button'))
    expect(container.querySelector('.gallery-lightbox')).toBeNull()

    click(container.querySelector('.gallery-back-button'))
    expect(window.location.search).not.toContain('album=')
  })

  test('shows gallery error and empty album states', async () => {
    coreMocks.fetchGoogleDriveGalleryAlbums.mockRejectedValueOnce(new Error('Drive is unavailable'))

    const errorTree = render(<GalleryPage language="en" />)

    await flushEffects()

    expect(errorTree.container.textContent).toContain(
      'The Google Drive gallery could not be loaded.',
    )

    cleanupTree(errorTree)
    coreMocks.fetchGoogleDriveGalleryAlbums.mockResolvedValueOnce([])

    const emptyTree = render(<GalleryPage language="en" />)

    await flushEffects()

    expect(emptyTree.container.textContent).toContain('There are no published albums yet.')
  })

  test('shows missing album and empty photo states from URL-selected albums', async () => {
    const album = createAlbum()

    window.history.replaceState({}, '', '/gallery/?album=missing')
    coreMocks.fetchGoogleDriveGalleryAlbums.mockResolvedValueOnce([album])

    const missingAlbumTree = render(<GalleryPage language="en" />)

    await flushEffects()

    expect(missingAlbumTree.container.textContent).toContain(
      'The album from this link was not found.',
    )

    cleanupTree(missingAlbumTree)
    window.history.replaceState({}, '', '/gallery/?album=workshop')
    coreMocks.fetchGoogleDriveGalleryAlbums.mockResolvedValueOnce([album])

    let resolvePhotos: (nextPhotos: GalleryPhoto[]) => void = () => undefined
    coreMocks.fetchGoogleDriveAlbumPhotos.mockReturnValueOnce(
      new Promise<GalleryPhoto[]>((resolve) => {
        resolvePhotos = resolve
      }),
    )

    const emptyPhotosTree = render(<GalleryPage language="en" />)

    await flushEffects()

    expect(emptyPhotosTree.container.textContent).toContain('Loading photos from the album.')

    await act(async () => {
      resolvePhotos([])
      await Promise.resolve()
    })
    await flushEffects()

    expect(emptyPhotosTree.container.textContent).toContain('This album does not have photos yet.')
  })

  test('shows photo loading errors and ignores stale gallery responses', async () => {
    const album = createAlbum()
    let resolveAlbums: (nextAlbums: GalleryAlbum[]) => void = () => undefined

    coreMocks.fetchGoogleDriveGalleryAlbums.mockReturnValueOnce(
      new Promise<GalleryAlbum[]>((resolve) => {
        resolveAlbums = resolve
      }),
    )

    const staleAlbumsTree = render(<GalleryPage language="en" />)

    cleanupTree(staleAlbumsTree)

    await act(async () => {
      resolveAlbums([album])
      await Promise.resolve()
    })

    window.history.replaceState({}, '', '/gallery/?album=workshop')
    coreMocks.fetchGoogleDriveGalleryAlbums.mockResolvedValueOnce([album])
    coreMocks.fetchGoogleDriveAlbumPhotos.mockRejectedValueOnce(new Error('Photos unavailable'))

    const photoErrorTree = render(<GalleryPage language="en" />)

    await flushEffects(6)

    expect(photoErrorTree.container.textContent).toContain(
      'Photos from this album could not be loaded.',
    )

    let resolvePhotos: (nextPhotos: GalleryPhoto[]) => void = () => undefined

    cleanupTree(photoErrorTree)
    window.history.replaceState({}, '', '/gallery/?album=workshop')
    coreMocks.fetchGoogleDriveGalleryAlbums.mockResolvedValueOnce([album])
    coreMocks.fetchGoogleDriveAlbumPhotos.mockReturnValueOnce(
      new Promise<GalleryPhoto[]>((resolve) => {
        resolvePhotos = resolve
      }),
    )

    const stalePhotosTree = render(<GalleryPage language="en" />)

    await flushEffects()
    cleanupTree(stalePhotosTree)

    await act(async () => {
      resolvePhotos([createPhoto()])
      await Promise.resolve()
    })

    expect(coreMocks.fetchGoogleDriveAlbumPhotos).toHaveBeenCalled()
  })
})

describe('gallery image behavior', () => {
  test('retries a refreshed image URL and marks the image as loaded', async () => {
    vi.useFakeTimers()
    coreMocks.fetchGoogleDriveThumbnailUrl.mockResolvedValue(
      'https://example.com/refreshed-thumb.jpg',
    )

    const { container } = render(
      <AlbumGrid
        albums={[createAlbum()]}
        apiKey="gallery-api-key"
        language="en"
        onAlbumSelect={vi.fn()}
      />,
    )

    dispatchImageEvent(getGalleryImage(container), 'load')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(galleryImageRetryDelays[0])
    })

    expect(coreMocks.fetchGoogleDriveThumbnailUrl).toHaveBeenCalledWith(
      'gallery-api-key',
      'cover-photo',
      720,
    )

    const retriedImage = getGalleryImage(container)
    setNaturalWidth(retriedImage, 800)
    dispatchImageEvent(retriedImage, 'load')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(galleryImageLogoSpinnerMinimumMs)
    })

    expect(getGalleryImageFrame(container).className).toContain('is-loaded')
  })

  test('marks an image as failed after retries are exhausted', async () => {
    vi.useFakeTimers()
    coreMocks.fetchGoogleDriveThumbnailUrl.mockResolvedValue(undefined)

    const { container } = render(
      <PhotoGrid
        album={createAlbum()}
        apiKey="gallery-api-key"
        language="en"
        photos={[createPhoto()]}
        onPhotoSelect={vi.fn()}
      />,
    )

    for (const retryDelay of galleryImageRetryDelays) {
      dispatchImageEvent(getGalleryImage(container), 'error')

      await act(async () => {
        await vi.advanceTimersByTimeAsync(retryDelay)
      })
    }

    dispatchImageEvent(getGalleryImage(container), 'error')

    expect(getGalleryImageFrame(container).className).toContain('is-failed')
  })

  test('corrects lightbox aspect ratio from the loaded image dimensions', async () => {
    const photo = createPhoto({
      height: 1952,
      id: 'portrait-with-landscape-metadata',
      width: 3264,
    })
    const { container } = render(
      <GalleryLightbox
        album={createAlbum()}
        language="en"
        photoId={photo.id}
        photos={[photo]}
        onClose={vi.fn()}
        onPhotoSelect={vi.fn()}
      />,
    )
    const frame = getGalleryImageFrame(container) as HTMLElement

    expect(frame.style.aspectRatio).toBe('3264 / 1952')

    const image = getGalleryImage(container)
    setNaturalSize(image, 1800, 3010)
    dispatchImageEvent(image, 'load')

    expect(frame.style.aspectRatio).toBe('1800 / 3010')
  })

  test('handles previous lightbox navigation and stale photo ids', () => {
    const onClose = vi.fn()
    const onPhotoSelect = vi.fn()
    const photos = [createPhoto({ id: 'first' }), createPhoto({ id: 'second' })]

    const validTree = render(
      <GalleryLightbox
        album={createAlbum()}
        language="en"
        photoId="second"
        photos={photos}
        onClose={onClose}
        onPhotoSelect={onPhotoSelect}
      />,
    )

    click(validTree.container.querySelector('.gallery-lightbox-nav.previous'))

    expect(onPhotoSelect).toHaveBeenCalledWith('first')

    const staleTree = render(
      <GalleryLightbox
        album={createAlbum()}
        language="en"
        photoId="missing"
        photos={photos}
        onClose={onClose}
        onPhotoSelect={onPhotoSelect}
      />,
    )

    expect(staleTree.container.querySelector('.gallery-lightbox')).toBeNull()
  })
})
