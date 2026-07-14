import type { GoogleSongsConfig } from './core'
import { createSlug, withBasePath } from './core'
import type { Language, LocalizedText } from './siteContent'

type GoogleSheetsErrorResponse = {
  error?: {
    message?: string
  }
}

type GoogleSheetsValueRange = {
  range?: string
  values?: string[][]
}

type GoogleSheetsValuesResponse = GoogleSheetsErrorResponse & {
  valueRanges?: GoogleSheetsValueRange[]
}

type SongSection = {
  active: boolean
  key: string
  order: number
  title: LocalizedText
}

type SongMaterialLink = {
  id: string
  label: Partial<Record<Language, string>>
  url: string
}

type Song = {
  id: string
  originalOrder: number
  sectionKey: string
  slug: string
  title: string
  links: SongMaterialLink[]
}

type SongsDataset = {
  sections: SongSection[]
  songs: Song[]
}

type RawSongGroup = {
  id: string
  originalOrder: number
  sectionKey: string
  title: string
  links: SongMaterialLink[]
}

const sectionsSheetTitle = 'Sections'
const songsSheetTitle = 'Songs'
const songSearchParam = 'song'
const languageLocale: Record<Language, string> = {
  pl: 'pl-PL',
  en: 'en-US',
}

function getSongsSheetUrl(config: GoogleSongsConfig, path = '') {
  return new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      config.spreadsheetId,
    )}${path}`,
  )
}

function normalizeCell(value: string | undefined) {
  return value?.trim() ?? ''
}

function normalizeHeader(value: string | undefined) {
  return normalizeCell(value).toLocaleLowerCase('en-US')
}

function getColumnIndex(headers: string[], columnName: string) {
  return headers.findIndex((header) => normalizeHeader(header) === columnName.toLocaleLowerCase('en-US'))
}

function getCell(row: string[], headers: string[], columnName: string) {
  const columnIndex = getColumnIndex(headers, columnName)

  return columnIndex >= 0 ? normalizeCell(row[columnIndex]) : ''
}

function parseSheetBoolean(value: string | undefined, fallback = false) {
  const normalizedValue = normalizeCell(value).toLocaleLowerCase('en-US')

  if (!normalizedValue) {
    return fallback
  }

  return normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'yes'
}

function parseSectionOrder(value: string, fallback: number) {
  const order = Number(value.replace(',', '.'))

  return Number.isFinite(order) ? order : fallback
}

function getSheetTitleFromRange(range?: string) {
  const sheetName = range?.split('!')[0] ?? ''

  return sheetName.startsWith("'") && sheetName.endsWith("'")
    ? sheetName.slice(1, -1).replaceAll("''", "'")
    : sheetName
}

function getRowsBySheetTitle(valueRanges: GoogleSheetsValueRange[]) {
  return new Map(
    valueRanges.map((valueRange) => [getSheetTitleFromRange(valueRange.range), valueRange.values ?? []]),
  )
}

function parseSongSections(rows: string[][]) {
  const headers = rows[0] ?? []

  return rows
    .slice(1)
    .map((row, index): SongSection | null => {
      const key = getCell(row, headers, 'key')
      const titlePl = getCell(row, headers, 'titlePl')
      const titleEn = getCell(row, headers, 'titleEn') || titlePl

      if (!key || !titlePl) {
        return null
      }

      return {
        active: parseSheetBoolean(getCell(row, headers, 'active'), true),
        key,
        order: parseSectionOrder(getCell(row, headers, 'order'), (index + 1) * 10),
        title: {
          pl: titlePl,
          en: titleEn,
        },
      }
    })
    .filter((section): section is SongSection => section !== null)
    .sort((first, second) => {
      const orderComparison = first.order - second.order

      return orderComparison === 0
        ? first.title.pl.localeCompare(second.title.pl, languageLocale.pl)
        : orderComparison
    })
}

function sanitizeSongMaterialUrl(value: string) {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function getSongGroupKey(sectionKey: string, title: string) {
  return `${sectionKey}\u0000${title}`
}

function compareSongs(first: Pick<Song, 'originalOrder' | 'sectionKey' | 'title'>, second: Pick<Song, 'originalOrder' | 'sectionKey' | 'title'>, sectionsByKey: Map<string, SongSection>) {
  const firstSection = sectionsByKey.get(first.sectionKey)
  const secondSection = sectionsByKey.get(second.sectionKey)
  const orderComparison = (firstSection?.order ?? 0) - (secondSection?.order ?? 0)

  if (orderComparison !== 0) {
    return orderComparison
  }

  const titleComparison = first.title.localeCompare(second.title, languageLocale.pl, {
    sensitivity: 'base',
  })

  return titleComparison === 0 ? first.originalOrder - second.originalOrder : titleComparison
}

function createUniqueSongSlugs(groups: RawSongGroup[]) {
  const baseSlugCounts = new Map<string, number>()
  const baseSlugs = groups.map((group, index) => createSlug(group.title) ?? `song-${index + 1}`)

  baseSlugs.forEach((baseSlug) => {
    baseSlugCounts.set(baseSlug, (baseSlugCounts.get(baseSlug) ?? 0) + 1)
  })

  const usedSlugCounts = new Map<string, number>()

  return baseSlugs.map((baseSlug) => {
    if ((baseSlugCounts.get(baseSlug) ?? 0) === 1) {
      return baseSlug
    }

    const nextCount = (usedSlugCounts.get(baseSlug) ?? 0) + 1
    usedSlugCounts.set(baseSlug, nextCount)

    return nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`
  })
}

function parseSongs(rows: string[][], sections: SongSection[]) {
  const headers = rows[0] ?? []
  const sectionsByKey = new Map(sections.filter((section) => section.active).map((section) => [section.key, section]))
  const groupsByKey = new Map<string, RawSongGroup>()

  rows.slice(1).forEach((row, rowIndex) => {
    if (!parseSheetBoolean(getCell(row, headers, 'active'), true)) {
      return
    }

    const title = getCell(row, headers, 'title')
    const sectionKey = getCell(row, headers, 'sectionKey')

    if (!title || !sectionsByKey.has(sectionKey)) {
      return
    }

    const groupKey = getSongGroupKey(sectionKey, title)
    const group =
      groupsByKey.get(groupKey) ??
      {
        id: `${sectionKey}-${rowIndex + 2}`,
        originalOrder: rowIndex,
        sectionKey,
        title,
        links: [],
      }

    groupsByKey.set(groupKey, group)

    const url = sanitizeSongMaterialUrl(getCell(row, headers, 'url'))

    if (!url) {
      return
    }

    group.links.push({
      id: `${group.id}-link-${group.links.length + 1}`,
      label: {
        pl: getCell(row, headers, 'labelPl') || undefined,
        en: getCell(row, headers, 'labelEn') || undefined,
      },
      url,
    })
  })

  const groups = Array.from(groupsByKey.values()).sort((first, second) =>
    compareSongs(first, second, sectionsByKey),
  )
  const slugs = createUniqueSongSlugs(groups)

  return groups.map((group, index): Song => ({
    ...group,
    slug: slugs[index],
  }))
}

function parseSongsSheetValues(valueRanges: GoogleSheetsValueRange[]): SongsDataset {
  const rowsBySheetTitle = getRowsBySheetTitle(valueRanges)
  const sections = parseSongSections(rowsBySheetTitle.get(sectionsSheetTitle) ?? [])
  const songs = parseSongs(rowsBySheetTitle.get(songsSheetTitle) ?? [], sections)

  return {
    sections: sections.filter((section) => section.active),
    songs,
  }
}

async function fetchSongsSheetValues(config: GoogleSongsConfig) {
  const url = getSongsSheetUrl(config, '/values:batchGet')
  ;[sectionsSheetTitle, songsSheetTitle].forEach((range) => url.searchParams.append('ranges', range))
  url.searchParams.set('majorDimension', 'ROWS')
  url.searchParams.set('valueRenderOption', 'FORMATTED_VALUE')
  url.searchParams.set('key', config.apiKey)

  const response = await fetch(url)
  const data = (await response.json()) as GoogleSheetsValuesResponse

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? 'Google Sheets values request failed')
  }

  return data.valueRanges ?? []
}

async function fetchGoogleSongsDataset(config: GoogleSongsConfig) {
  return parseSongsSheetValues(await fetchSongsSheetValues(config))
}

function getSongSlugFromLocation() {
  const slug = new URLSearchParams(globalThis.location.search).get(songSearchParam)

  return slug ? createSlug(slug) ?? null : null
}

function getSongHref(slug: string) {
  return withBasePath(`/songs/?${songSearchParam}=${encodeURIComponent(slug)}`)
}

function getAbsoluteSongHref(slug: string) {
  return new URL(getSongHref(slug), globalThis.location.origin).href
}

function replaceSongUrl(slug: string | null) {
  const url = new URL(globalThis.location.href)

  if (slug) {
    url.pathname = new URL(withBasePath('/songs/'), globalThis.location.origin).pathname
    url.searchParams.set(songSearchParam, slug)
  } else {
    url.searchParams.delete(songSearchParam)
  }

  globalThis.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function getSongDomId(song: Song) {
  return `song-${song.slug}`
}

export {
  fetchGoogleSongsDataset,
  getAbsoluteSongHref,
  getSongDomId,
  getSongHref,
  getSongSlugFromLocation,
  parseSongsSheetValues,
  replaceSongUrl,
}

export type {
  Song,
  SongMaterialLink,
  SongSection,
  SongsDataset,
}
