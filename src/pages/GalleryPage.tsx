import { useEffect, useMemo, useRef, useState } from 'react'
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
  type GalleryPhotosState,
  type GalleryState,
} from '../core'

function GalleryPage({ language }: { language: Language }) {
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

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
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

          {galleryState.status === 'ready' && !activeAlbum && galleryState.albums.length === 0 && (
            <GalleryStatusMessage status="ready">
              {translate(galleryText.emptyAlbums, language)}
            </GalleryStatusMessage>
          )}

          {galleryState.status === 'ready' && activeAlbum ? (
            <div className="gallery-album-view">
              <GalleryAlbumHeader
                album={activeAlbum}
                language={language}
                photoCount={activePhotosState?.status === 'ready' ? activePhotos.length : undefined}
                onBack={() => selectAlbum(null)}
              />

              {activePhotosState?.status === 'loading' || !activePhotosState ? (
                <GalleryStatusMessage status="loading">
                  {translate(galleryText.loadingPhotos, language)}
                </GalleryStatusMessage>
              ) : activePhotosState.status === 'error' ? (
                <GalleryStatusMessage status="error">
                  {translate(galleryText.errorPhotos, language)}
                </GalleryStatusMessage>
              ) : activePhotos.length === 0 ? (
                <GalleryStatusMessage status="ready">
                  {translate(galleryText.emptyPhotos, language)}
                </GalleryStatusMessage>
              ) : (
                <PhotoGrid
                  album={activeAlbum}
                  apiKey={googleDriveGalleryConfig?.apiKey}
                  language={language}
                  photos={activePhotos}
                  onPhotoSelect={(nextPhotoId) => selectPhoto(nextPhotoId)}
                />
              )}

              {activePhoto && photoId && (
                <GalleryLightbox
                  album={activeAlbum}
                  apiKey={googleDriveGalleryConfig?.apiKey}
                  language={language}
                  photos={activePhotos}
                  photoId={photoId}
                  onClose={() => selectPhoto(null)}
                  onPhotoSelect={(nextPhotoId) => selectPhoto(nextPhotoId, true)}
                />
              )}
            </div>
          ) : galleryState.status === 'ready' && galleryState.albums.length > 0 ? (
            <AlbumGrid
              albums={galleryState.albums}
              apiKey={googleDriveGalleryConfig?.apiKey}
              language={language}
              onAlbumSelect={(nextAlbumSlug) => selectAlbum(nextAlbumSlug)}
            />
          ) : null}
        </div>
      </section>
    </>
  )
}

export { GalleryPage }
