import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { galleryText, type Language } from '../siteContent'
import { PageHeading } from '../components/Layout'
import {
  AlbumGrid,
  GalleryAlbumHeader,
  GalleryLightbox,
  GalleryStatusMessage,
  PhotoGrid,
} from '../components/Gallery'
import {
  emptyGalleryPhotos,
  fetchGoogleDriveAlbumPhotos,
  fetchGoogleDriveGalleryAlbums,
  getGalleryAlbumSlugFromLocation,
  getGalleryPhotoIdFromLocation,
  getGoogleDriveGalleryConfig,
  translate,
  updateGalleryUrl,
  type GalleryAlbum,
  type GalleryPhoto,
  type GalleryPhotosState,
  type GalleryState,
} from '../core'

function GalleryStateMessages({
  galleryState,
  language,
  shouldShowMissingAlbum,
}: Readonly<{
  galleryState: GalleryState
  language: Language
  shouldShowMissingAlbum: boolean
}>) {
  return (
    <>
      {galleryState.status === 'loading' && (
        <GalleryStatusMessage status="loading">
          {translate(galleryText.loadingAlbums, language)}
        </GalleryStatusMessage>
      )}

      {galleryState.status === 'unconfigured' && (
        <GalleryStatusMessage status="unconfigured">
          {translate(galleryText.notConfiguredNotice, language)}
        </GalleryStatusMessage>
      )}

      {galleryState.status === 'error' && (
        <GalleryStatusMessage status="error">
          {translate(galleryText.errorNotice, language)}
        </GalleryStatusMessage>
      )}

      {shouldShowMissingAlbum && (
        <GalleryStatusMessage status="warning">
          {translate(galleryText.albumNotFound, language)}
        </GalleryStatusMessage>
      )}

      {galleryState.status === 'ready' && galleryState.albums.length === 0 && (
        <GalleryStatusMessage status="ready">
          {translate(galleryText.emptyAlbums, language)}
        </GalleryStatusMessage>
      )}
    </>
  )
}

function GalleryAlbumView({
  activeAlbum,
  activePhoto,
  activePhotos,
  activePhotosState,
  apiKey,
  language,
  onBack,
  onPhotoSelect,
  photoId,
}: Readonly<{
  activeAlbum: GalleryAlbum
  activePhoto: GalleryPhoto | undefined
  activePhotos: GalleryPhoto[]
  activePhotosState: GalleryPhotosState | undefined
  apiKey: string | undefined
  language: Language
  onBack: () => void
  onPhotoSelect: (photoId: string | null, replace?: boolean) => void
  photoId: string | null
}>) {
  let photosContent: ReactNode

  if (!activePhotosState || activePhotosState.status === 'loading') {
    photosContent = (
      <GalleryStatusMessage status="loading">
        {translate(galleryText.loadingPhotos, language)}
      </GalleryStatusMessage>
    )
  } else if (activePhotosState.status === 'error') {
    photosContent = (
      <GalleryStatusMessage status="error">
        {translate(galleryText.errorPhotos, language)}
      </GalleryStatusMessage>
    )
  } else if (activePhotos.length === 0) {
    photosContent = (
      <GalleryStatusMessage status="ready">
        {translate(galleryText.emptyPhotos, language)}
      </GalleryStatusMessage>
    )
  } else {
    photosContent = (
      <PhotoGrid
        album={activeAlbum}
        apiKey={apiKey}
        language={language}
        photos={activePhotos}
        onPhotoSelect={(nextPhotoId) => onPhotoSelect(nextPhotoId)}
      />
    )
  }

  return (
    <div className="gallery-album-view">
      <GalleryAlbumHeader
        album={activeAlbum}
        language={language}
        photoCount={activePhotosState?.status === 'ready' ? activePhotos.length : undefined}
        onBack={onBack}
      />

      {photosContent}

      {activePhoto && photoId && (
        <GalleryLightbox
          album={activeAlbum}
          apiKey={apiKey}
          language={language}
          photos={activePhotos}
          photoId={photoId}
          onClose={() => onPhotoSelect(null)}
          onPhotoSelect={(nextPhotoId) => onPhotoSelect(nextPhotoId, true)}
        />
      )}
    </div>
  )
}

function GalleryReadyContent({
  activeAlbum,
  activePhoto,
  activePhotos,
  activePhotosState,
  apiKey,
  galleryState,
  language,
  onAlbumSelect,
  onPhotoSelect,
  photoId,
}: Readonly<{
  activeAlbum: GalleryAlbum | undefined
  activePhoto: GalleryPhoto | undefined
  activePhotos: GalleryPhoto[]
  activePhotosState: GalleryPhotosState | undefined
  apiKey: string | undefined
  galleryState: GalleryState
  language: Language
  onAlbumSelect: (albumSlug: string | null) => void
  onPhotoSelect: (photoId: string | null, replace?: boolean) => void
  photoId: string | null
}>) {
  if (galleryState.status !== 'ready') {
    return null
  }

  if (activeAlbum) {
    return (
      <GalleryAlbumView
        activeAlbum={activeAlbum}
        activePhoto={activePhoto}
        activePhotos={activePhotos}
        activePhotosState={activePhotosState}
        apiKey={apiKey}
        language={language}
        onBack={() => onAlbumSelect(null)}
        onPhotoSelect={onPhotoSelect}
        photoId={photoId}
      />
    )
  }

  if (galleryState.albums.length === 0) {
    return null
  }

  return (
    <AlbumGrid
      albums={galleryState.albums}
      apiKey={apiKey}
      language={language}
      onAlbumSelect={(nextAlbumSlug) => onAlbumSelect(nextAlbumSlug)}
    />
  )
}

function GalleryPage({ language }: Readonly<{ language: Language }>) {
  const googleDriveGalleryConfig = useMemo(() => getGoogleDriveGalleryConfig(), [])
  const [galleryState, setGalleryState] = useState<GalleryState>({
    status: googleDriveGalleryConfig ? 'loading' : 'unconfigured',
    albums: [],
  })
  const [albumSlug, setAlbumSlug] = useState<string | null>(getGalleryAlbumSlugFromLocation)
  const [photoId, setPhotoId] = useState<string | null>(getGalleryPhotoIdFromLocation)
  const [photoStates, setPhotoStates] = useState<Record<string, GalleryPhotosState>>({})
  const photoStatesRef = useRef(photoStates)
  const activeAlbum = albumSlug
    ? galleryState.albums.find((album) => album.slug === albumSlug)
    : undefined
  const activePhotosState = activeAlbum ? photoStates[activeAlbum.id] : undefined
  const activePhotos = activePhotosState?.photos ?? emptyGalleryPhotos
  const activePhoto = photoId ? activePhotos.find((photo) => photo.id === photoId) : undefined
  const shouldShowMissingAlbum =
    galleryState.status === 'ready' && Boolean(albumSlug) && !activeAlbum

  function selectAlbum(nextAlbumSlug: string | null) {
    setAlbumSlug(nextAlbumSlug)
    setPhotoId(null)
    updateGalleryUrl(nextAlbumSlug, null)
  }

  function selectPhoto(nextPhotoId: string | null, replace = false) {
    setPhotoId(nextPhotoId)
    updateGalleryUrl(activeAlbum?.slug ?? null, nextPhotoId, replace)
  }

  useEffect(() => {
    photoStatesRef.current = photoStates
  }, [photoStates])

  useEffect(() => {
    if (!googleDriveGalleryConfig) {
      return
    }

    let isActive = true

    fetchGoogleDriveGalleryAlbums(googleDriveGalleryConfig)
      .then((albums) => {
        if (!isActive) {
          return
        }

        setGalleryState({
          status: 'ready',
          albums,
        })
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setGalleryState({
          status: 'error',
          albums: [],
        })
      })

    return () => {
      isActive = false
    }
  }, [googleDriveGalleryConfig])

  useEffect(() => {
    function handlePopState() {
      setAlbumSlug(getGalleryAlbumSlugFromLocation())
      setPhotoId(getGalleryPhotoIdFromLocation())
    }

    globalThis.addEventListener('popstate', handlePopState)

    return () => {
      globalThis.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!googleDriveGalleryConfig || !activeAlbum || photoStatesRef.current[activeAlbum.id]) {
      return
    }

    let isActive = true

    setPhotoStates((currentPhotoStates) => ({
      ...currentPhotoStates,
      [activeAlbum.id]: {
        status: 'loading',
        photos: [],
      },
    }))

    fetchGoogleDriveAlbumPhotos(googleDriveGalleryConfig, activeAlbum)
      .then((photos) => {
        if (!isActive) {
          return
        }

        setPhotoStates((currentPhotoStates) => ({
          ...currentPhotoStates,
          [activeAlbum.id]: {
            status: 'ready',
            photos,
          },
        }))
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setPhotoStates((currentPhotoStates) => ({
          ...currentPhotoStates,
          [activeAlbum.id]: {
            status: 'error',
            photos: [],
          },
        }))
      })

    return () => {
      isActive = false
    }
  }, [activeAlbum, googleDriveGalleryConfig])

  return (
    <>
      <PageHeading page="gallery" language={language} />
      <section className="content-section">
        <div className="content-width gallery-layout">
          <GalleryStateMessages
            galleryState={galleryState}
            language={language}
            shouldShowMissingAlbum={shouldShowMissingAlbum}
          />
          <GalleryReadyContent
            activeAlbum={activeAlbum}
            activePhoto={activePhoto}
            activePhotos={activePhotos}
            activePhotosState={activePhotosState}
            apiKey={googleDriveGalleryConfig?.apiKey}
            galleryState={galleryState}
            language={language}
            onAlbumSelect={selectAlbum}
            onPhotoSelect={selectPhoto}
            photoId={photoId}
          />
        </div>
      </section>
    </>
  )
}

export { GalleryPage }
