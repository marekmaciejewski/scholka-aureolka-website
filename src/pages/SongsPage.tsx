import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageHeading } from '../components/Layout'
import { songsText, type Language } from '../siteContent'
import { copyTextToClipboard, getGoogleSongsConfig, translate } from '../core'
import {
  fetchGoogleSongsDataset,
  getAbsoluteSongHref,
  getSongDomId,
  getSongSlugFromLocation,
  replaceSongUrl,
  type Song,
  type SongMaterialLink,
  type SongsDataset,
} from '../songs'

type SongsState =
  | {
      dataset: SongsDataset
      status: 'ready'
    }
  | {
      dataset?: undefined
      status: 'error' | 'loading' | 'unconfigured'
    }

type SongsFilters = {
  onlyWithLinks: boolean
  query: string
  sectionKey: string
}

const allSectionsKey = 'all'
const defaultSongsFilters: SongsFilters = {
  onlyWithLinks: false,
  query: '',
  sectionKey: allSectionsKey,
}

function CopyLinkIcon({ isCopied }: Readonly<{ isCopied: boolean }>) {
  return (
    <svg
      className="song-action-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {isCopied ? (
        <path d="m5 12 4 4L19 6" />
      ) : (
        <>
          <path d="M10.5 13.5 13.5 10.5" />
          <path d="M8.5 16.5 7.25 17.75a4 4 0 0 1-5.66-5.66l2.12-2.12a4 4 0 0 1 5.66 0" />
          <path d="m15.5 7.5 1.25-1.25a4 4 0 0 1 5.66 5.66l-2.12 2.12a4 4 0 0 1-5.66 0" />
        </>
      )}
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      className="song-material-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  )
}

function SongsStatusMessage({
  children,
  status,
}: Readonly<{
  children: ReactNode
  status: SongsState['status'] | 'ready' | 'warning'
}>) {
  return <output className={`songs-status ${status}`}>{children}</output>
}

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase('pl-PL')
}

function getSongLinkLabel(link: SongMaterialLink, language: Language) {
  const requestedLabel = link.label[language]?.trim()
  const fallbackLanguage: Language = language === 'pl' ? 'en' : 'pl'
  const fallbackLabel = link.label[fallbackLanguage]?.trim()

  return requestedLabel || fallbackLabel || translate(songsText.openMaterialFallback, language)
}

function songMatchesSearch(song: Song, query: string, language: Language) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return true
  }

  const searchableText = [
    song.title,
    ...song.links.flatMap((link) => [
      link.label.pl ?? '',
      link.label.en ?? '',
      getSongLinkLabel(link, language),
    ]),
  ].join(' ')

  return normalizeSearchText(searchableText).includes(normalizedQuery)
}

function songMatchesFilters(song: Song, filters: SongsFilters, language: Language) {
  if (filters.sectionKey !== allSectionsKey && song.sectionKey !== filters.sectionKey) {
    return false
  }

  if (filters.onlyWithLinks && song.links.length === 0) {
    return false
  }

  return songMatchesSearch(song, filters.query, language)
}

function getSectionSongCounts(songs: Song[]) {
  return songs.reduce((counts, song) => {
    counts.set(song.sectionKey, (counts.get(song.sectionKey) ?? 0) + 1)
    return counts
  }, new Map<string, number>())
}

function getVisibleSongGroups(
  dataset: SongsDataset,
  filters: SongsFilters,
  language: Language,
) {
  const visibleSongs = dataset.songs.filter((song) => songMatchesFilters(song, filters, language))

  return dataset.sections
    .map((section) => ({
      section,
      songs: visibleSongs.filter((song) => song.sectionKey === section.key),
    }))
    .filter((group) => group.songs.length > 0)
}

function SongsFiltersPanel({
  dataset,
  filters,
  language,
  onFiltersChange,
}: Readonly<{
  dataset: SongsDataset
  filters: SongsFilters
  language: Language
  onFiltersChange: (filters: SongsFilters) => void
}>) {
  const sectionCounts = getSectionSongCounts(dataset.songs)
  const allSongCount = dataset.songs.length

  return (
    <div className="songs-toolbar">
      <div className="songs-search-field">
        <label htmlFor="songs-search">{translate(songsText.searchLabel, language)}</label>
        <input
          id="songs-search"
          type="search"
          value={filters.query}
          placeholder={translate(songsText.searchPlaceholder, language)}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              query: event.currentTarget.value,
            })
          }
        />
      </div>

      <label className="songs-link-filter">
        <input
          type="checkbox"
          checked={filters.onlyWithLinks}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              onlyWithLinks: event.currentTarget.checked,
            })
          }
        />
        <span>{translate(songsText.onlyWithLinks, language)}</span>
      </label>

      <nav
        className="songs-section-nav"
        aria-label={translate(songsText.sectionNavigation, language)}
      >
        <button
          type="button"
          className="songs-section-button"
          aria-pressed={filters.sectionKey === allSectionsKey}
          onClick={() => onFiltersChange({ ...filters, sectionKey: allSectionsKey })}
        >
          <span>{translate(songsText.allSections, language)}</span>
          <strong>{allSongCount}</strong>
        </button>
        {dataset.sections.map((section) => (
          <button
            type="button"
            className="songs-section-button"
            aria-pressed={filters.sectionKey === section.key}
            key={section.key}
            onClick={() => onFiltersChange({ ...filters, sectionKey: section.key })}
          >
            <span>{translate(section.title, language)}</span>
            <strong>{sectionCounts.get(section.key) ?? 0}</strong>
          </button>
        ))}
      </nav>
    </div>
  )
}

function SongCard({
  copiedSongSlug,
  isLinked,
  language,
  onSongLinkCopy,
  song,
}: Readonly<{
  copiedSongSlug: string | null
  isLinked: boolean
  language: Language
  onSongLinkCopy: (song: Song) => void
  song: Song
}>) {
  const isCopied = copiedSongSlug === song.slug
  const copySongLinkText = translate(
    isCopied ? songsText.songLinkCopied : songsText.copySongLink,
    language,
  )

  return (
    <article className={isLinked ? 'song-card is-linked' : 'song-card'} id={getSongDomId(song)}>
      <div className="song-card-heading">
        <h3>{song.title}</h3>
        <button
          type="button"
          className={isCopied ? 'song-copy-button is-copied' : 'song-copy-button'}
          aria-label={`${copySongLinkText}: ${song.title}`}
          onClick={() => onSongLinkCopy(song)}
        >
          <CopyLinkIcon isCopied={isCopied} />
        </button>
      </div>

      {song.links.length > 0 ? (
        <ul className="song-material-list">
          {song.links.map((link) => (
            <li key={link.id}>
              <a
                className="song-material-link"
                href={link.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${getSongLinkLabel(link, language)} - ${translate(songsText.externalMaterial, language)}`}
              >
                <span>{getSongLinkLabel(link, language)}</span>
                <ExternalLinkIcon />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="song-empty-materials">{translate(songsText.noMaterials, language)}</p>
      )}
    </article>
  )
}

function SongsReadyContent({
  dataset,
  language,
}: Readonly<{
  dataset: SongsDataset
  language: Language
}>) {
  const [filters, setFilters] = useState<SongsFilters>({
    ...defaultSongsFilters,
  })
  const [linkedSongSlug, setLinkedSongSlug] = useState<string | null>(getSongSlugFromLocation)
  const [copiedSongSlug, setCopiedSongSlug] = useState<string | null>(null)
  const linkedSong = linkedSongSlug
    ? dataset.songs.find((song) => song.slug === linkedSongSlug)
    : undefined
  const visibleSongGroups = useMemo(
    () => getVisibleSongGroups(dataset, filters, language),
    [dataset, filters, language],
  )
  const visibleSongs = visibleSongGroups.flatMap((group) => group.songs)
  const shouldShowMissingLinkedSong = Boolean(linkedSongSlug) && !linkedSong

  function updateFilters(nextFilters: SongsFilters) {
    if (linkedSongSlug) {
      setLinkedSongSlug(null)
      replaceSongUrl(null)
    }

    setFilters(nextFilters)
  }

  function copySongLink(song: Song) {
    copyTextToClipboard(getAbsoluteSongHref(song.slug))
      .then(() => setCopiedSongSlug(song.slug))
      .catch(() => setCopiedSongSlug(null))
  }

  useEffect(() => {
    function handlePopState() {
      const nextLinkedSongSlug = getSongSlugFromLocation()

      setLinkedSongSlug(nextLinkedSongSlug)

      if (nextLinkedSongSlug) {
        setFilters({ ...defaultSongsFilters })
      }
    }

    globalThis.addEventListener('popstate', handlePopState)

    return () => {
      globalThis.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!linkedSong) {
      return
    }

    const scrollTimeout = globalThis.setTimeout(() => {
      document
        .getElementById(getSongDomId(linkedSong))
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 0)

    return () => {
      globalThis.clearTimeout(scrollTimeout)
    }
  }, [linkedSong])

  return (
    <div className="songs-layout">
      <SongsFiltersPanel
        dataset={dataset}
        filters={filters}
        language={language}
        onFiltersChange={updateFilters}
      />

      {shouldShowMissingLinkedSong && (
        <SongsStatusMessage status="warning">
          {translate(songsText.linkedSongNotFound, language)}
        </SongsStatusMessage>
      )}

      {visibleSongs.length === 0 ? (
        <p className="songs-empty">{translate(songsText.emptyState, language)}</p>
      ) : (
        <div className="songs-results">
          {visibleSongGroups.map((group) => (
            <section className="songs-section-group" key={group.section.key}>
              <h2>{translate(group.section.title, language)}</h2>
              <div className="song-list">
                {group.songs.map((song) => (
                  <SongCard
                    copiedSongSlug={copiedSongSlug}
                    isLinked={linkedSong?.slug === song.slug}
                    key={song.slug}
                    language={language}
                    song={song}
                    onSongLinkCopy={copySongLink}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function SongsPage({ language }: Readonly<{ language: Language }>) {
  const googleSongsConfig = useMemo(() => getGoogleSongsConfig(), [])
  const [songsState, setSongsState] = useState<SongsState>({
    status: googleSongsConfig ? 'loading' : 'unconfigured',
  })

  useEffect(() => {
    if (!googleSongsConfig) {
      return
    }

    let isActive = true

    fetchGoogleSongsDataset(googleSongsConfig)
      .then((dataset) => {
        if (!isActive) {
          return
        }

        setSongsState({
          dataset,
          status: 'ready',
        })
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setSongsState({
          status: 'error',
        })
      })

    return () => {
      isActive = false
    }
  }, [googleSongsConfig])

  return (
    <>
      <PageHeading page="songs" language={language} />
      <section className="content-section">
        <div className="content-width">
          {songsState.status === 'loading' && (
            <SongsStatusMessage status="loading">
              {translate(songsText.loading, language)}
            </SongsStatusMessage>
          )}

          {songsState.status === 'unconfigured' && (
            <SongsStatusMessage status="unconfigured">
              {translate(songsText.notConfiguredNotice, language)}
            </SongsStatusMessage>
          )}

          {songsState.status === 'error' && (
            <SongsStatusMessage status="error">
              {translate(songsText.errorNotice, language)}
            </SongsStatusMessage>
          )}

          {songsState.status === 'ready' && (
            <SongsReadyContent dataset={songsState.dataset} language={language} />
          )}
        </div>
      </section>
    </>
  )
}

export { SongsPage }
