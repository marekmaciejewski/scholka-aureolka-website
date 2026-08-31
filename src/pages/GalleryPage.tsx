import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AchievementsCard,
  AchievementsTimeline,
  GalleryAlbumHeader,
  GalleryLightbox,
  GalleryStatusMessage,
} from '../components/Gallery'
import { PageHeading } from '../components/Layout'
import {
  emptyGalleryPhotos,
  fetchGoogleAchievementsPhotos,
  getGalleryAlbumSlugFromLocation,
  getGalleryPhotoIdFromLocation,
  getGoogleAchievementsConfig,
  getPrivateGalleryUrl,
  getPublicAchievementsAlbum,
  translate,
  updateGalleryUrl,
  type GalleryPhotosState,
} from '../core'
import { galleryText, type Language } from '../siteContent'

function PrivateGalleryCard({ language }: Readonly<{ language: Language }>) {
  const privateGalleryUrl = getPrivateGalleryUrl()

  return (
    <article className="gallery-access-card private-gallery-card">
      <div className="private-gallery-lock" aria-hidden="true">
        <span />
      </div>
      <div className="gallery-access-copy private-gallery-copy">
        <p className="eyebrow">{translate(galleryText.accessEyebrow, language)}</p>
        <h2>{translate(galleryText.accessTitle, language)}</h2>
        <p>{translate(galleryText.accessDescription, language)}</p>
        <p className="private-gallery-sign-in-note">
          {translate(galleryText.signInNote, language)}
        </p>

        {privateGalleryUrl ? (
          <div className="private-gallery-action">
            <a
              className="button primary private-gallery-button"
              href={privateGalleryUrl}
              target="_blank"
              rel="noreferrer"
            >
              {translate(galleryText.openPrivateGallery, language)}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        ) : (
          <output className="private-gallery-status">
            {translate(galleryText.notConfiguredNotice, language)}
          </output>
        )}

        <aside
          className="private-gallery-privacy-note"
          aria-label={translate(galleryText.privacyTitle, language)}
        >
          <strong>{translate(galleryText.privacyTitle, language)}</strong>
          <p>{translate(galleryText.privacyDescription, language)}</p>
        </aside>
      </div>
    </article>
  )
}

function GalleryLanding({
  language,
  onAchievementsOpen,
}: Readonly<{
  language: Language
  onAchievementsOpen: () => void
}>) {
  const achievementsAlbum = getPublicAchievementsAlbum()

  return (
    <div className="gallery-access-grid">
      <AchievementsCard
        album={achievementsAlbum}
        language={language}
        onOpen={onAchievementsOpen}
      />
      <PrivateGalleryCard language={language} />
    </div>
  )
}

function AchievementsAlbumView({
  language,
  photosState,
  photoId,
  onBack,
  onPhotoSelect,
}: Readonly<{
  language: Language
  photosState: GalleryPhotosState
  photoId: string | null
  onBack: () => void
  onPhotoSelect: (photoId: string | null, replace?: boolean) => void
}>) {
  const album = getPublicAchievementsAlbum()
  const config = getGoogleAchievementsConfig()
  const photos = photosState.photos ?? emptyGalleryPhotos
  const activePhoto = photoId ? photos.find((photo) => photo.id === photoId) : undefined
  let content: ReactNode

  if (photosState.status === 'loading') {
    content = (
      <GalleryStatusMessage status="loading">
        {translate(galleryText.loadingPhotos, language)}
      </GalleryStatusMessage>
    )
  } else if (photosState.status === 'unconfigured') {
    content = (
      <GalleryStatusMessage status="unconfigured">
        {translate(galleryText.achievementsNotConfigured, language)}
      </GalleryStatusMessage>
    )
  } else if (photosState.status === 'error') {
    content = (
      <GalleryStatusMessage status="error">
        {translate(galleryText.errorPhotos, language)}
      </GalleryStatusMessage>
    )
  } else if (photos.length === 0) {
    content = (
      <GalleryStatusMessage status="ready">
        {translate(galleryText.emptyPhotos, language)}
      </GalleryStatusMessage>
    )
  } else {
    content = (
      <AchievementsTimeline
        album={album}
        apiKey={config?.apiKey}
        language={language}
        photos={photos}
        onPhotoSelect={(nextPhotoId) => onPhotoSelect(nextPhotoId)}
      />
    )
  }

  return (
    <div className="gallery-album-view">
      <GalleryAlbumHeader
        album={album}
        language={language}
        photoCount={photosState.status === 'ready' ? photos.length : undefined}
        onBack={onBack}
      />
      {content}
      {activePhoto && photoId && (
        <GalleryLightbox
          album={album}
          apiKey={config?.apiKey}
          language={language}
          photos={photos}
          photoId={photoId}
          onClose={() => onPhotoSelect(null)}
          onPhotoSelect={(nextPhotoId) => onPhotoSelect(nextPhotoId, true)}
        />
      )}
    </div>
  )
}

function GalleryPage({ language }: Readonly<{ language: Language }>) {
  const achievementsConfig = useMemo(() => getGoogleAchievementsConfig(), [])
  const [showAchievements, setShowAchievements] = useState(
    () => getGalleryAlbumSlugFromLocation() === 'achievements',
  )
  const [photoId, setPhotoId] = useState<string | null>(getGalleryPhotoIdFromLocation)
  const [photosState, setPhotosState] = useState<GalleryPhotosState>({
    status: achievementsConfig ? 'loading' : 'unconfigured',
    photos: [],
  })

  function selectAchievements(nextShowAchievements: boolean) {
    if (nextShowAchievements && achievementsConfig) {
      setPhotosState({ status: 'loading', photos: [] })
    }

    setShowAchievements(nextShowAchievements)
    setPhotoId(null)
    updateGalleryUrl(nextShowAchievements, null)
  }

  function selectPhoto(nextPhotoId: string | null, replace = false) {
    setPhotoId(nextPhotoId)
    updateGalleryUrl(true, nextPhotoId, replace)
  }

  useEffect(() => {
    function handlePopState() {
      const nextShowAchievements = getGalleryAlbumSlugFromLocation() === 'achievements'

      if (nextShowAchievements && achievementsConfig) {
        setPhotosState({ status: 'loading', photos: [] })
      }

      setShowAchievements(nextShowAchievements)
      setPhotoId(getGalleryPhotoIdFromLocation())
    }

    globalThis.addEventListener('popstate', handlePopState)
    return () => globalThis.removeEventListener('popstate', handlePopState)
  }, [achievementsConfig])

  useEffect(() => {
    if (!showAchievements || !achievementsConfig) {
      return
    }

    let isActive = true

    fetchGoogleAchievementsPhotos(achievementsConfig)
      .then((photos) => {
        if (isActive) setPhotosState({ status: 'ready', photos })
      })
      .catch(() => {
        if (isActive) setPhotosState({ status: 'error', photos: [] })
      })

    return () => {
      isActive = false
    }
  }, [achievementsConfig, showAchievements])

  return (
    <>
      <PageHeading page="gallery" language={language} />
      <section className="content-section">
        <div className="content-width gallery-layout">
          {showAchievements ? (
            <AchievementsAlbumView
              language={language}
              photosState={photosState}
              photoId={photoId}
              onBack={() => selectAchievements(false)}
              onPhotoSelect={selectPhoto}
            />
          ) : (
            <GalleryLanding
              language={language}
              onAchievementsOpen={() => selectAchievements(true)}
            />
          )}
        </div>
      </section>
    </>
  )
}

export { GalleryPage }
