import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent as ReactSyntheticEvent,
} from 'react'
import { galleryText, logoPaths, type Language } from '../siteContent'
import {
  fetchGoogleDriveThumbnailUrl,
  formatGalleryAlbumDate,
  formatGalleryPhotoCount,
  formatGalleryPhotoPosition,
  galleryImageLogoSpinnerMinimumMs,
  galleryImageRetryDelays,
  getGalleryAlbumHref,
  getGalleryPhotoAlt,
  getGalleryPhotoAspectStyle,
  getGalleryPhotoHref,
  getLogoForTheme,
  translate,
  withBasePath,
  type GalleryAlbum,
  type GalleryLoadStatus,
  type GalleryPhoto,
} from '../core'

type GalleryImageStatus = 'failed' | 'loaded' | 'loading'

function GalleryStatusMessage({
  status,
  children,
}: Readonly<{
  status: GalleryLoadStatus | 'warning'
  children: string
}>) {
  return (
    <output className={`gallery-status ${status}`}>
      {children}
    </output>
  )
}

function GalleryImageLoadingLogo() {
  return (
    <span className="gallery-image-loading-logo" aria-hidden="true">
      <img
        className="gallery-image-loading-logo-mark gallery-image-loading-logo-mark-light"
        src={withBasePath(logoPaths.lightPurple)}
        alt=""
      />
      <img
        className="gallery-image-loading-logo-mark gallery-image-loading-logo-mark-dark"
        src={withBasePath(logoPaths.darkPurple)}
        alt=""
      />
    </span>
  )
}

function GalleryImage({
  src,
  refreshSrc,
  alt,
  loading = 'lazy',
  variant,
  style,
}: Readonly<{
  src: string
  refreshSrc?: () => Promise<string | undefined>
  alt: string
  loading?: 'eager' | 'lazy'
  variant: 'cover' | 'thumbnail' | 'lightbox'
  style?: CSSProperties
}>) {
  const [attempt, setAttempt] = useState({ retryCount: 0, src })
  const [status, setStatus] = useState<GalleryImageStatus>('loading')
  const retryTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | undefined>(undefined)
  const loadCompleteTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | undefined>(
    undefined,
  )
  const loadingStartedAtRef = useRef(0)
  const isMountedRef = useRef(true)
  const imageStatusClassName = getGalleryImageStatusClassName(status)
  const imageClassName = [
    'gallery-image',
    `gallery-image-${variant}`,
    imageStatusClassName,
  ]
    .filter(Boolean)
    .join(' ')

  useEffect(
    () => {
      isMountedRef.current = true
      loadingStartedAtRef.current = Date.now()

      return () => {
        isMountedRef.current = false

        if (retryTimeoutRef.current) {
          globalThis.clearTimeout(retryTimeoutRef.current)
          retryTimeoutRef.current = undefined
        }

        if (loadCompleteTimeoutRef.current) {
          globalThis.clearTimeout(loadCompleteTimeoutRef.current)
          loadCompleteTimeoutRef.current = undefined
        }
      }
    },
    [],
  )

  function scheduleRetry(nextRetryCount: number, delay: number) {
    if (retryTimeoutRef.current) {
      return
    }

    setStatus('loading')
    loadingStartedAtRef.current = Date.now()
    retryTimeoutRef.current = globalThis.setTimeout(async () => {
      retryTimeoutRef.current = undefined

      let nextSrc = attempt.src

      if (refreshSrc) {
        try {
          nextSrc = (await refreshSrc()) ?? nextSrc
        } catch {
          nextSrc = attempt.src
        }
      }

      if (!isMountedRef.current) {
        return
      }

      setAttempt({
        retryCount: nextRetryCount,
        src: nextSrc,
      })
    }, delay)
  }

  function handleImageError() {
    const nextRetryCount = attempt.retryCount + 1

    if (nextRetryCount <= galleryImageRetryDelays.length) {
      scheduleRetry(nextRetryCount, galleryImageRetryDelays[nextRetryCount - 1])
      return
    }

    setStatus('failed')
  }

  function completeImageLoad() {
    if (loadingStartedAtRef.current === 0) {
      loadingStartedAtRef.current = Date.now()
    }

    const remainingSpinnerTime =
      galleryImageLogoSpinnerMinimumMs - (Date.now() - loadingStartedAtRef.current)

    if (remainingSpinnerTime <= 0) {
      setStatus('loaded')
      return
    }

    if (loadCompleteTimeoutRef.current) {
      globalThis.clearTimeout(loadCompleteTimeoutRef.current)
    }

    loadCompleteTimeoutRef.current = globalThis.setTimeout(() => {
      loadCompleteTimeoutRef.current = undefined

      if (isMountedRef.current) {
        setStatus('loaded')
      }
    }, remainingSpinnerTime)
  }

  function handleImageLoad(event: ReactSyntheticEvent<HTMLImageElement>) {
    if (event.currentTarget.naturalWidth === 0) {
      handleImageError()
      return
    }

    if (retryTimeoutRef.current) {
      globalThis.clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = undefined
    }

    completeImageLoad()
  }

  return (
    <span className={imageClassName} style={style}>
      <span className="gallery-image-spinner" aria-hidden="true">
        <GalleryImageLoadingLogo />
      </span>
      <span className="gallery-image-error-symbol" aria-hidden="true" />
      <img
        key={`${attempt.src}-${attempt.retryCount}`}
        src={attempt.src}
        alt={alt}
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </span>
  )
}

function getGalleryImageStatusClassName(status: GalleryImageStatus) {
  if (status === 'loaded') {
    return 'is-loaded'
  }

  if (status === 'failed') {
    return 'is-failed'
  }

  return 'is-loading'
}

function AlbumGrid({
  albums,
  apiKey,
  language,
  onAlbumSelect,
}: Readonly<{
  albums: GalleryAlbum[]
  apiKey?: string
  language: Language
  onAlbumSelect: (albumSlug: string) => void
}>) {
  return (
    <div className="card-grid album-grid">
      {albums.map((album) => {
        const albumTitle = translate(album.title, language)
        const coverPhoto = album.coverPhoto
        const openAlbumLabel = `${translate(galleryText.openAlbum, language)}: ${albumTitle}`

        function handleAlbumClick(event: ReactMouseEvent<HTMLAnchorElement>) {
          event.preventDefault()
          onAlbumSelect(album.slug)
        }

        return (
          <a
            className="album-card gallery-album-card"
            key={album.id}
            href={getGalleryAlbumHref(album.slug)}
            aria-label={openAlbumLabel}
            onClick={handleAlbumClick}
          >
            <div className="album-cover">
              {coverPhoto ? (
                <GalleryImage
                  key={`${coverPhoto.id}-${coverPhoto.thumbnailUrl}`}
                  src={coverPhoto.thumbnailUrl}
                  refreshSrc={
                    apiKey
                      ? () => fetchGoogleDriveThumbnailUrl(apiKey, coverPhoto.id, 720)
                      : undefined
                  }
                  alt=""
                  loading="lazy"
                  variant="cover"
                />
              ) : (
                <img
                  className="album-cover-placeholder"
                  src={withBasePath(getLogoForTheme('light', 'purple'))}
                  alt=""
                />
              )}
            </div>
            <div className="album-body">
              <p className="eyebrow">{formatGalleryAlbumDate(album, language)}</p>
              <h3>{albumTitle}</h3>
            </div>
          </a>
        )
      })}
    </div>
  )
}

function GalleryAlbumHeader({
  album,
  language,
  photoCount,
  onBack,
}: Readonly<{
  album: GalleryAlbum
  language: Language
  photoCount?: number
  onBack: () => void
}>) {
  return (
    <div className="gallery-album-header">
      <div>
        <p className="eyebrow">{formatGalleryAlbumDate(album, language)}</p>
        <h2>{translate(album.title, language)}</h2>
        {typeof photoCount === 'number' && (
          <p className="muted">{formatGalleryPhotoCount(photoCount, language)}</p>
        )}
      </div>
      <button
        type="button"
        className="gallery-back-button"
        aria-label={translate(galleryText.backToAlbums, language)}
        title={translate(galleryText.backToAlbums, language)}
        onClick={onBack}
      >
        ←
      </button>
    </div>
  )
}

function PhotoGrid({
  album,
  apiKey,
  language,
  photos,
  onPhotoSelect,
}: Readonly<{
  album: GalleryAlbum
  apiKey?: string
  language: Language
  photos: GalleryPhoto[]
  onPhotoSelect: (photoId: string) => void
}>) {
  const photoAlt = getGalleryPhotoAlt(album, language)

  return (
    <div className="photo-grid">
      {photos.map((photo, index) => {
        function handlePhotoClick(event: ReactMouseEvent<HTMLAnchorElement>) {
          event.preventDefault()
          onPhotoSelect(photo.id)
        }

        return (
          <a
            className="photo-tile"
            key={photo.id}
            href={getGalleryPhotoHref(album.slug, photo.id)}
            aria-label={`${translate(galleryText.openPhoto, language)} ${index + 1}`}
            onClick={handlePhotoClick}
          >
            <GalleryImage
              key={`${photo.id}-${photo.thumbnailUrl}`}
              src={photo.thumbnailUrl}
              refreshSrc={
                apiKey ? () => fetchGoogleDriveThumbnailUrl(apiKey, photo.id, 720) : undefined
              }
              alt={photoAlt}
              loading="lazy"
              variant="thumbnail"
            />
          </a>
        )
      })}
    </div>
  )
}

function GalleryLightbox({
  album,
  apiKey,
  language,
  photos,
  photoId,
  onClose,
  onPhotoSelect,
}: Readonly<{
  album: GalleryAlbum
  apiKey?: string
  language: Language
  photos: GalleryPhoto[]
  photoId: string
  onClose: () => void
  onPhotoSelect: (photoId: string) => void
}>) {
  const photoIndex = photos.findIndex((photo) => photo.id === photoId)
  const photo = photoIndex >= 0 ? photos[photoIndex] : undefined
  const previousPhoto = photoIndex > 0 ? photos[photoIndex - 1] : undefined
  const nextPhoto = photoIndex >= 0 && photoIndex < photos.length - 1 ? photos[photoIndex + 1] : undefined

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'ArrowLeft' && previousPhoto) {
        onPhotoSelect(previousPhoto.id)
      }

      if (event.key === 'ArrowRight' && nextPhoto) {
        onPhotoSelect(nextPhoto.id)
      }
    }

    document.body.style.overflow = 'hidden'
    globalThis.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      globalThis.removeEventListener('keydown', handleKeyDown)
    }
  }, [nextPhoto, onClose, onPhotoSelect, previousPhoto])

  if (!photo) {
    return null
  }

  return (
    <div className="gallery-lightbox-backdrop">
      <button
        type="button"
        className="dialog-backdrop-button"
        aria-label={translate(galleryText.closePhoto, language)}
        tabIndex={-1}
        onClick={onClose}
      />
      <dialog
        open
        className="gallery-lightbox"
        aria-modal="true"
        aria-label={translate(album.title, language)}
      >
        <div className="gallery-lightbox-bar">
          <div>
            <strong>{translate(album.title, language)}</strong>
            <span>{formatGalleryPhotoPosition(photoIndex + 1, photos.length, language)}</span>
          </div>
          <button
            type="button"
            className="gallery-lightbox-button"
            aria-label={translate(galleryText.closePhoto, language)}
            onClick={onClose}
            autoFocus
          >
            X
          </button>
        </div>
        <div className="gallery-lightbox-stage">
          <button
            type="button"
            className="gallery-lightbox-button gallery-lightbox-nav previous"
            aria-label={translate(galleryText.previousPhoto, language)}
            disabled={!previousPhoto}
            onClick={() => previousPhoto && onPhotoSelect(previousPhoto.id)}
          >
            {'<'}
          </button>
          <GalleryImage
            key={`${photo.id}-${photo.largeUrl}`}
            src={photo.largeUrl}
            refreshSrc={
              apiKey ? () => fetchGoogleDriveThumbnailUrl(apiKey, photo.id, 1800) : undefined
            }
            alt={getGalleryPhotoAlt(album, language)}
            loading="eager"
            variant="lightbox"
            style={getGalleryPhotoAspectStyle(photo)}
          />
          <button
            type="button"
            className="gallery-lightbox-button gallery-lightbox-nav next"
            aria-label={translate(galleryText.nextPhoto, language)}
            disabled={!nextPhoto}
            onClick={() => nextPhoto && onPhotoSelect(nextPhoto.id)}
          >
            {'>'}
          </button>
        </div>
      </dialog>
    </div>
  )
}

export { AlbumGrid, GalleryAlbumHeader, GalleryLightbox, GalleryStatusMessage, PhotoGrid }
