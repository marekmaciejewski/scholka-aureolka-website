import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  calendarEventHighlightText,
  commonText,
  contactDetails,
  defaultLanguage,
  footerCredits,
  footerQuote,
  galleryText,
  homeHeroCta,
  homeHeroText,
  languageOptions,
  logoPaths,
  navigationItems,
  noticeText,
  pageIntro,
  firstStepsModal,
  scheduleCards,
  scheduleText,
  type Language,
  type LocalizedText,
  type PageKey,
  type ThemeName,
} from './siteContent'

type EventSource = 'google-calendar' | 'birthday-calendar'

type UpcomingEvent = {
  id: string
  date: Date
  endDate?: Date
  title: string
  location?: string
  note?: string
  noteBlocks?: CalendarRichBlock[]
  attachments?: CalendarEventAttachment[]
  slug?: string
  isAllDay?: boolean
  source: EventSource
  eventColor?: CalendarEventColor
  eventHighlight?: EventHighlight
  isNotice?: boolean
}

type CalendarLoadStatus = 'unconfigured' | 'loading' | 'ready' | 'error'

type CalendarState = {
  status: CalendarLoadStatus
  events: UpcomingEvent[]
}

type GalleryLoadStatus = 'unconfigured' | 'loading' | 'ready' | 'error'

type GalleryAlbum = {
  id: string
  folderName: string
  slug: string
  title: LocalizedText
  date: Date | undefined
  coverPhoto: GalleryPhoto | undefined
}

type GalleryPhoto = {
  id: string
  name: string
  thumbnailUrl: string
  largeUrl: string
  width?: number
  height?: number
}

type GalleryState = {
  status: GalleryLoadStatus
  albums: GalleryAlbum[]
}

type GalleryPhotosState = {
  status: GalleryLoadStatus
  photos: GalleryPhoto[]
}

type GoogleCalendarEventDate = {
  date?: string
  dateTime?: string
  timeZone?: string
}

type GoogleCalendarAttachment = {
  fileUrl?: string
  title?: string
  mimeType?: string
  iconLink?: string
  fileId?: string
}

type GoogleCalendarEvent = {
  id?: string
  iCalUID?: string
  summary?: string
  location?: string
  description?: string
  attachments?: GoogleCalendarAttachment[]
  colorId?: string
  status?: string
  start?: GoogleCalendarEventDate
  end?: GoogleCalendarEventDate
}

type GoogleCalendarResponse = {
  items?: GoogleCalendarEvent[]
  error?: {
    message?: string
  }
}

type GoogleCalendarColor = {
  background?: string
  foreground?: string
}

type GoogleCalendarColorsResponse = {
  event?: Record<string, GoogleCalendarColor>
  error?: {
    message?: string
  }
}

type GoogleDriveFile = {
  id?: string
  name?: string
  mimeType?: string
  thumbnailLink?: string
  imageMediaMetadata?: {
    width?: number
    height?: number
  }
}

type GoogleDriveFilesResponse = {
  files?: GoogleDriveFile[]
  nextPageToken?: string
  error?: {
    message?: string
  }
}

type CalendarEventColor = {
  background: string
  foreground?: string
}

type CalendarEventColorMap = Record<string, CalendarEventColor>

type EventHighlightKind = 'birthday' | 'important'

type EventHighlight = {
  kind: EventHighlightKind
  accent?: string
}

type EventCardStyle = CSSProperties & {
  '--event-accent'?: string
}

type CalendarRichParagraphBlock = {
  kind: 'paragraph'
  html: string
  text: string
}

type CalendarRichListBlock = {
  kind: 'unordered-list' | 'ordered-list'
  items: Array<{
    html: string
    text: string
  }>
}

type CalendarRichSpacerBlock = {
  kind: 'spacer'
}

type CalendarRichBlock = CalendarRichParagraphBlock | CalendarRichListBlock | CalendarRichSpacerBlock

type CalendarRichInlineToken =
  | {
      kind: 'content'
      html: string
      text: string
    }
  | {
      kind: 'break'
    }

type CalendarDescriptionMetadata = {
  blocks: CalendarRichBlock[]
  text: string
  slug?: string
}

type CalendarEventAttachment = {
  id: string
  title: string
  url: string
  mimeType?: string
  iconUrl?: string
}

type GoogleCalendarConfig = {
  apiKey: string
  calendars: Array<{
    calendarId: string
    source: EventSource
  }>
}

type GoogleDriveGalleryConfig = {
  apiKey: string
  folderId: string
}

const languageStorageKey = 'scholka-aureolka-language'
const themeStorageKey = 'scholka-aureolka-theme'
const eventSlugSearchParam = 'event'
const galleryAlbumSearchParam = 'album'
const galleryPhotoSearchParam = 'photo'
const calendarNoticePrefixPattern = /^\s*\[notice\]\s*:?\s*/i
const galleryCoverPrefixPattern = /^\s*\[cover\]/i
const homeScheduleCards = scheduleCards.slice(0, 2)
const childrenMassCard = scheduleCards[2]
const birthdayEventAccent = 'var(--color-violet)'
const importantEventAccent = 'var(--color-important)'
const polishOneLetterWordPattern = /(^|[\s([{„"'])(([AaIiOoUuWwZz]))\s+(?=\S)/g

const languageLocale: Record<Language, string> = {
  pl: 'pl-PL',
  en: 'en-US',
}
const emptyGalleryPhotos: GalleryPhoto[] = []

function getBasePath() {
  return import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
}

function withBasePath(path: string) {
  if (path.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(path)) {
    return path
  }

  return `${getBasePath()}${path.replace(/^\/+/, '')}`
}

function getScheduleEventHref(slug: string) {
  return withBasePath(`/schedule/?${eventSlugSearchParam}=${encodeURIComponent(slug)}`)
}

function isExpandableScheduleEvent(event: UpcomingEvent) {
  return (
    event.eventHighlight?.kind !== 'birthday' &&
    (Boolean(event.note) || Boolean(event.attachments?.length))
  )
}

function getHomeEventHref(event: UpcomingEvent) {
  if (isExpandableScheduleEvent(event) && event.slug) {
    return getScheduleEventHref(event.slug)
  }

  return withBasePath('/schedule/')
}

function getAbsoluteScheduleEventHref(slug: string) {
  return new URL(getScheduleEventHref(slug), window.location.origin).href
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  document.body.append(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
  } finally {
    textArea.remove()
  }
}

function removeBasePath(pathname: string) {
  const basePath = new URL(getBasePath(), window.location.origin).pathname

  if (basePath !== '/' && pathname.startsWith(basePath)) {
    return `/${pathname.slice(basePath.length)}`
  }

  return pathname
}

function applyPolishNoBreaks(value: string) {
  return value.replace(polishOneLetterWordPattern, `$1$2\u00a0`)
}

function formatLocalizedText(value: string, language: Language) {
  return language === 'pl' ? applyPolishNoBreaks(value) : value
}

function formatLocalizedHtml(value: string, language: Language) {
  if (language !== 'pl') {
    return value
  }

  return value
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith('<') ? part : applyPolishNoBreaks(part)))
    .join('')
}

function translate(text: LocalizedText, language: Language) {
  return formatLocalizedText(text[language], language)
}

function translateOptional(text: LocalizedText | string, language: Language) {
  return typeof text === 'string' ? formatLocalizedText(text, language) : translate(text, language)
}

function isNoticeCalendarTitle(title: string) {
  return calendarNoticePrefixPattern.test(title)
}

function getNoticeCalendarTitle(title: string, language: Language) {
  const noticeTitle = title.replace(calendarNoticePrefixPattern, '').trim()

  return noticeTitle || translate(noticeText.defaultTitle, language)
}

function getGoogleApiKey() {
  return (
    import.meta.env.VITE_GOOGLE_API_KEY?.trim() ??
    import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY?.trim() ??
    ''
  )
}

function getGoogleCalendarConfig(): GoogleCalendarConfig | null {
  const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID?.trim()
  const birthdayCalendarId = import.meta.env.VITE_GOOGLE_BIRTHDAY_CALENDAR_ID?.trim()
  const apiKey = getGoogleApiKey()
  const calendars: GoogleCalendarConfig['calendars'] = []

  if (calendarId) {
    calendars.push({
      calendarId,
      source: 'google-calendar',
    })
  }

  if (birthdayCalendarId) {
    calendars.push({
      calendarId: birthdayCalendarId,
      source: 'birthday-calendar',
    })
  }

  if (!apiKey || calendars.length === 0) {
    return null
  }

  return { apiKey, calendars }
}

function getGoogleDriveGalleryConfig(): GoogleDriveGalleryConfig | null {
  const folderId = import.meta.env.VITE_GOOGLE_DRIVE_GALLERY_FOLDER_ID?.trim()
  const apiKey = getGoogleApiKey()

  if (!apiKey || !folderId) {
    return null
  }

  return { apiKey, folderId }
}

function getInitialLanguage(): Language {
  const storedLanguage = window.localStorage.getItem(languageStorageKey)

  if (storedLanguage === 'pl' || storedLanguage === 'en') {
    return storedLanguage
  }

  return defaultLanguage
}

function getInitialTheme(): ThemeName {
  const storedTheme = window.localStorage.getItem(themeStorageKey)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getPageFromPath(pathname: string): PageKey {
  const path = removeBasePath(pathname).replace(/\/+$/, '') || '/'

  if (path === '/gallery') {
    return 'gallery'
  }

  if (path === '/schedule') {
    return 'schedule'
  }

  if (path === '/contact') {
    return 'contact'
  }

  return 'home'
}

function getLogoForTheme(theme: ThemeName, surface: 'header' | 'purple') {
  if (surface === 'purple') {
    return theme === 'dark' ? logoPaths.darkPurple : logoPaths.lightPurple
  }

  return theme === 'dark' ? logoPaths.darkHeader : logoPaths.lightHeader
}

function formatEventDate(date: Date, language: Language) {
  return new Intl.DateTimeFormat(languageLocale[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function formatEventTime(date: Date, language: Language) {
  return new Intl.DateTimeFormat(languageLocale[language], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMonth(date: Date, language: Language) {
  return new Intl.DateTimeFormat(languageLocale[language], {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatEventSlugDateTime(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    `${pad(date.getHours())}${pad(date.getMinutes())}`,
  ].join('-')
}

function createEventSlug(value: string) {
  const slug = value
    .replace(/[łŁ]/g, 'l')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 96)
    .replace(/-+$/g, '')

  return slug || undefined
}

function createFallbackEventSlug(title: string, date: Date) {
  return createEventSlug(`${formatEventSlugDateTime(date)}-${title}`)
}

function createGallerySlug(value: string) {
  const slug = value
    .replace(/[łŁ]/g, 'l')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 96)
    .replace(/-+$/g, '')

  return slug || undefined
}

function parseGalleryAlbumFolderName(folderName: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})\s*(?:-\s*)?(.+)?$/.exec(folderName.trim())
  const titleValue = match?.[4]?.trim() || folderName.trim()
  const titleParts = titleValue.split(/\s+--\s+/, 2)
  const plTitle = titleParts[0]?.trim() || folderName.trim()
  const enTitle = titleParts[1]?.trim() || plTitle
  const year = match ? Number(match[1]) : 0
  const month = match ? Number(match[2]) : 0
  const day = match ? Number(match[3]) : 0
  const date = year && month && day ? new Date(year, month - 1, day) : undefined

  return {
    title: { pl: plTitle, en: enTitle },
    date,
  }
}

function formatGalleryAlbumDate(album: GalleryAlbum, language: Language) {
  if (!album.date) {
    return album.folderName
  }

  return new Intl.DateTimeFormat(languageLocale[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(album.date)
}

function formatGalleryPhotoCount(count: number, language: Language) {
  if (count === 1) {
    return translate(galleryText.photoCountSingular, language)
  }

  return translate(galleryText.photoCountPlural, language).replace('{count}', String(count))
}

function formatGalleryPhotoPosition(current: number, total: number, language: Language) {
  return translate(galleryText.photoPosition, language)
    .replace('{current}', String(current))
    .replace('{total}', String(total))
}

function getGalleryPhotoAlt(album: GalleryAlbum, language: Language) {
  return translate(galleryText.albumPhotoAlt, language).replace(
    '{album}',
    translate(album.title, language),
  )
}

function getEventSlugFromLocation() {
  const slug = new URLSearchParams(window.location.search).get(eventSlugSearchParam)

  return slug ? createEventSlug(slug) ?? null : null
}

function getGalleryAlbumSlugFromLocation() {
  const slug = new URLSearchParams(window.location.search).get(galleryAlbumSearchParam)

  return slug ? createGallerySlug(slug) ?? null : null
}

function getGalleryPhotoIdFromLocation() {
  return new URLSearchParams(window.location.search).get(galleryPhotoSearchParam)
}

function replaceScheduleEventUrl(slug: string | null) {
  const url = new URL(window.location.href)

  if (slug) {
    url.pathname = new URL(withBasePath('/schedule/'), window.location.origin).pathname
    url.searchParams.set(eventSlugSearchParam, slug)
  } else {
    url.searchParams.delete(eventSlugSearchParam)
  }

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function getGalleryAlbumHref(slug: string) {
  return withBasePath(`/gallery/?${galleryAlbumSearchParam}=${encodeURIComponent(slug)}`)
}

function getGalleryPhotoHref(albumSlug: string, photoId: string) {
  return withBasePath(
    `/gallery/?${galleryAlbumSearchParam}=${encodeURIComponent(albumSlug)}&${galleryPhotoSearchParam}=${encodeURIComponent(photoId)}`,
  )
}

function updateGalleryUrl(albumSlug: string | null, photoId: string | null, replace = false) {
  const url = new URL(window.location.href)
  url.pathname = new URL(withBasePath('/gallery/'), window.location.origin).pathname
  url.search = ''

  if (albumSlug) {
    url.searchParams.set(galleryAlbumSearchParam, albumSlug)
  }

  if (albumSlug && photoId) {
    url.searchParams.set(galleryPhotoSearchParam, photoId)
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`

  if (replace) {
    window.history.replaceState({}, '', nextUrl)
    return
  }

  window.history.pushState({}, '', nextUrl)
}

function escapeDriveQueryString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

async function fetchGoogleDriveFiles(
  apiKey: string,
  options: {
    q: string
    fields: string
    orderBy?: string
    pageSize?: number
    pageToken?: string
  },
) {
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('q', options.q)
  url.searchParams.set('fields', options.fields)
  url.searchParams.set('pageSize', String(options.pageSize ?? 100))

  if (options.orderBy) {
    url.searchParams.set('orderBy', options.orderBy)
  }

  if (options.pageToken) {
    url.searchParams.set('pageToken', options.pageToken)
  }

  const response = await fetch(url.href)
  const data = (await response.json()) as GoogleDriveFilesResponse

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? 'Google Drive request failed')
  }

  return data
}

async function fetchAllGoogleDriveFiles(
  apiKey: string,
  options: {
    q: string
    fields: string
    orderBy?: string
    pageSize?: number
  },
) {
  const files: GoogleDriveFile[] = []
  let pageToken: string | undefined

  do {
    const data = await fetchGoogleDriveFiles(apiKey, {
      ...options,
      pageToken,
    })

    files.push(...(data.files ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return files
}

function resizeGoogleThumbnail(thumbnailLink: string | undefined, width: number) {
  if (!thumbnailLink) {
    return undefined
  }

  if (/=[swh]\d+(?:-[cp])?$/.test(thumbnailLink)) {
    return thumbnailLink.replace(/=[swh]\d+(?:-[cp])?$/, `=w${width}`)
  }

  return thumbnailLink
}

function getDriveImageFallbackUrl(fileId: string, width: number) {
  const url = new URL('https://drive.google.com/thumbnail')
  url.searchParams.set('id', fileId)
  url.searchParams.set('sz', `w${width}`)

  return url.href
}

function getGalleryPhotoFromDriveFile(file: GoogleDriveFile): GalleryPhoto | null {
  if (!file.id || !file.name) {
    return null
  }

  return {
    id: file.id,
    name: file.name,
    thumbnailUrl: resizeGoogleThumbnail(file.thumbnailLink, 720) ?? getDriveImageFallbackUrl(file.id, 720),
    largeUrl: resizeGoogleThumbnail(file.thumbnailLink, 1800) ?? getDriveImageFallbackUrl(file.id, 1800),
    width: file.imageMediaMetadata?.width,
    height: file.imageMediaMetadata?.height,
  }
}

async function fetchGoogleDriveAlbumCover(
  config: GoogleDriveGalleryConfig,
  albumFolderId: string,
) {
  const escapedFolderId = escapeDriveQueryString(albumFolderId)
  const fields = 'files(id,name,mimeType,thumbnailLink,imageMediaMetadata(width,height)),nextPageToken'
  const coverQuery = [
    `'${escapedFolderId}' in parents`,
    "mimeType contains 'image/'",
    'trashed = false',
    "name contains '[cover]'",
  ].join(' and ')
  const coverData = await fetchGoogleDriveFiles(config.apiKey, {
    q: coverQuery,
    fields,
    orderBy: 'name',
    pageSize: 10,
  })
  const coverPhoto = (coverData.files ?? [])
    .map(getGalleryPhotoFromDriveFile)
    .find((photo): photo is GalleryPhoto => Boolean(photo && galleryCoverPrefixPattern.test(photo.name)))

  if (coverPhoto) {
    return coverPhoto
  }

  const firstPhotoQuery = [
    `'${escapedFolderId}' in parents`,
    "mimeType contains 'image/'",
    'trashed = false',
  ].join(' and ')
  const firstPhotoData = await fetchGoogleDriveFiles(config.apiKey, {
    q: firstPhotoQuery,
    fields,
    orderBy: 'name',
    pageSize: 1,
  })

  return (firstPhotoData.files ?? [])
    .map(getGalleryPhotoFromDriveFile)
    .find((photo): photo is GalleryPhoto => Boolean(photo))
}

async function fetchGoogleDriveGalleryAlbums(config: GoogleDriveGalleryConfig) {
  const escapedFolderId = escapeDriveQueryString(config.folderId)
  const folders = await fetchAllGoogleDriveFiles(config.apiKey, {
    q: [
      `'${escapedFolderId}' in parents`,
      "mimeType = 'application/vnd.google-apps.folder'",
      'trashed = false',
    ].join(' and '),
    fields: 'files(id,name,mimeType),nextPageToken',
    orderBy: 'name',
    pageSize: 100,
  })

  const albums = await Promise.all(
    folders.map(async (folder) => {
      if (!folder.id || !folder.name) {
        return null
      }

      const parsedFolderName = parseGalleryAlbumFolderName(folder.name)
      const slug = createGallerySlug(folder.name)

      if (!slug) {
        return null
      }

      return {
        id: folder.id,
        folderName: folder.name,
        slug,
        title: parsedFolderName.title,
        date: parsedFolderName.date,
        coverPhoto: await fetchGoogleDriveAlbumCover(config, folder.id),
      }
    }),
  )

  return albums
    .filter((album): album is GalleryAlbum => Boolean(album))
    .sort((leftAlbum, rightAlbum) => {
      const leftDate = leftAlbum.date?.getTime() ?? 0
      const rightDate = rightAlbum.date?.getTime() ?? 0

      if (leftDate !== rightDate) {
        return rightDate - leftDate
      }

      return rightAlbum.folderName.localeCompare(leftAlbum.folderName, 'pl-PL', { numeric: true })
    })
}

async function fetchGoogleDriveAlbumPhotos(
  config: GoogleDriveGalleryConfig,
  album: GalleryAlbum,
) {
  const escapedFolderId = escapeDriveQueryString(album.id)
  const files = await fetchAllGoogleDriveFiles(config.apiKey, {
    q: [`'${escapedFolderId}' in parents`, "mimeType contains 'image/'", 'trashed = false'].join(
      ' and ',
    ),
    fields: 'files(id,name,mimeType,thumbnailLink,imageMediaMetadata(width,height)),nextPageToken',
    orderBy: 'name',
    pageSize: 1000,
  })

  return files
    .map(getGalleryPhotoFromDriveFile)
    .filter((photo): photo is GalleryPhoto => Boolean(photo))
}

function getEventDomId(event: UpcomingEvent) {
  return `event-${(event.slug ?? event.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

function parseGoogleDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function parseGoogleEventDate(value?: GoogleCalendarEventDate) {
  if (!value) {
    return null
  }

  if (value.dateTime) {
    return {
      date: new Date(value.dateTime),
      isAllDay: false,
    }
  }

  if (value.date) {
    const date = parseGoogleDateOnly(value.date)

    if (!date) {
      return null
    }

    return {
      date,
      isAllDay: true,
    }
  }

  return null
}

function normalizeCalendarText(value?: string) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return ''
  }

  if (!trimmedValue.includes('<')) {
    return trimmedValue
  }

  const parsedDocument = new DOMParser().parseFromString(trimmedValue, 'text/html')
  parsedDocument.body.querySelectorAll('br').forEach((breakElement) => {
    breakElement.replaceWith('\n')
  })
  parsedDocument.body.querySelectorAll('div, li, p').forEach((blockElement) => {
    blockElement.append('\n')
  })

  return (parsedDocument.body.textContent ?? trimmedValue)
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeCalendarUrl(value?: string | null) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return undefined
  }

  try {
    const url = new URL(trimmedValue, window.location.origin)

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href
    }
  } catch {
    return undefined
  }

  return undefined
}

function renderCalendarLinkHtml(url: string, label = url) {
  const safeUrl = sanitizeCalendarUrl(url)

  if (!safeUrl) {
    return escapeHtml(label)
  }

  return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
}

function linkifyCalendarText(value: string) {
  const urlPattern = /https?:\/\/[^\s<>"']+/gi
  let html = ''
  let lastIndex = 0

  value.replace(urlPattern, (match, offset: number) => {
    html += escapeHtml(value.slice(lastIndex, offset))
    html += renderCalendarLinkHtml(match)
    lastIndex = offset + match.length
    return match
  })

  return html + escapeHtml(value.slice(lastIndex))
}

function createPlainTextParagraphBlock(value: string): CalendarRichParagraphBlock | null {
  const text = value.replace(/\u00a0/g, ' ').trim()

  if (!text) {
    return null
  }

  return {
    kind: 'paragraph',
    html: linkifyCalendarText(text),
    text,
  }
}

function createPlainTextCalendarBlocks(value: string) {
  const lines = value
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/)
  const blocks: CalendarRichBlock[] = []

  lines.forEach((line, index) => {
    const block = createPlainTextParagraphBlock(line)

    if (block) {
      blocks.push(block)
      return
    }

    const hasContentBefore = lines.slice(0, index).some((previousLine) => previousLine.trim())
    const hasContentAfter = lines.slice(index + 1).some((nextLine) => nextLine.trim())

    if (hasContentBefore && hasContentAfter) {
      blocks.push({ kind: 'spacer' })
    }
  })

  return blocks
}

const calendarDescriptionBlockTags = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'div',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'li',
  'main',
  'nav',
  'p',
  'section',
])

function isCalendarElement(node: Node): node is Element {
  return node.nodeType === 1
}

function isCalendarTextNode(node: Node) {
  return node.nodeType === 3
}

function getCalendarNodeText(node: Node): string {
  if (isCalendarTextNode(node)) {
    return node.textContent ?? ''
  }

  if (!isCalendarElement(node)) {
    return ''
  }

  const tagName = node.tagName.toLocaleLowerCase('en-US')

  if (tagName === 'br') {
    return '\n'
  }

  return Array.from(node.childNodes).map(getCalendarNodeText).join('')
}

function normalizeCalendarBlockText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function tokenizeCalendarText(value: string): CalendarRichInlineToken[] {
  const lines = value.replace(/\r\n?/g, '\n').split('\n')
  const tokens: CalendarRichInlineToken[] = []

  lines.forEach((line, index) => {
    if (line) {
      tokens.push({
        kind: 'content',
        html: escapeHtml(line),
        text: line,
      })
    }

    if (index < lines.length - 1) {
      tokens.push({ kind: 'break' })
    }
  })

  return tokens
}

function wrapCalendarInlineTokens(
  tokens: CalendarRichInlineToken[],
  tagName: string,
  attributes = '',
): CalendarRichInlineToken[] {
  return tokens.map((token) =>
    token.kind === 'break'
      ? token
      : {
          kind: 'content',
          html: `<${tagName}${attributes}>${token.html}</${tagName}>`,
          text: token.text,
        },
  )
}

function tokenizeCalendarChildren(node: Node): CalendarRichInlineToken[] {
  return Array.from(node.childNodes).flatMap(tokenizeCalendarNode)
}

function tokenizeCalendarNode(node: Node): CalendarRichInlineToken[] {
  if (isCalendarTextNode(node)) {
    return tokenizeCalendarText(node.textContent ?? '')
  }

  if (!isCalendarElement(node)) {
    return []
  }

  const tagName = node.tagName.toLocaleLowerCase('en-US')

  if (tagName === 'br') {
    return [{ kind: 'break' }]
  }

  if (tagName === 'script' || tagName === 'style') {
    return []
  }

  const children = tokenizeCalendarChildren(node)

  if (tagName === 'a') {
    const href = sanitizeCalendarUrl(node.getAttribute('href'))

    if (!href) {
      return children
    }

    const visibleChildren =
      children.some((token) => token.kind === 'content' && token.text.trim())
        ? children
        : [
            {
              kind: 'content' as const,
              html: escapeHtml(href),
              text: href,
            },
          ]

    return wrapCalendarInlineTokens(
      visibleChildren,
      'a',
      ` href="${escapeHtml(href)}" target="_blank" rel="noreferrer"`,
    )
  }

  if (tagName === 'strong' || tagName === 'b') {
    return wrapCalendarInlineTokens(children, 'strong')
  }

  if (tagName === 'em' || tagName === 'i') {
    return wrapCalendarInlineTokens(children, 'em')
  }

  if (tagName === 'u') {
    return wrapCalendarInlineTokens(children, 'u')
  }

  if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
    return wrapCalendarInlineTokens(children, 's')
  }

  return children
}

function createCalendarBlocksFromInlineTokens(
  tokens: CalendarRichInlineToken[],
  preserveEmptyBlock = false,
): CalendarRichBlock[] {
  const blocks: CalendarRichBlock[] = []
  let html = ''
  let text = ''
  let hasBreak = false

  function hasContentAfter(index: number) {
    return tokens
      .slice(index + 1)
      .some((token) => token.kind === 'content' && token.text.trim())
  }

  function flushContent() {
    const normalizedText = normalizeCalendarBlockText(text)

    if (!normalizedText) {
      html = ''
      text = ''
      return false
    }

    blocks.push({
      kind: 'paragraph',
      html: html.trim(),
      text: normalizedText,
    })
    html = ''
    text = ''
    return true
  }

  tokens.forEach((token, index) => {
    if (token.kind === 'break') {
      hasBreak = true

      if (!flushContent() && hasContentAfter(index)) {
        blocks.push({ kind: 'spacer' })
      }

      return
    }

    html += token.html
    text += token.text
  })

  flushContent()

  if (blocks.length === 0 && preserveEmptyBlock && hasBreak) {
    blocks.push({ kind: 'spacer' })
  }

  return blocks
}

function createCalendarParagraphBlocks(node: Node): CalendarRichBlock[] {
  return createCalendarBlocksFromInlineTokens(tokenizeCalendarChildren(node), true)
}

function createCalendarListBlock(element: Element): CalendarRichListBlock | null {
  const tagName = element.tagName.toLocaleLowerCase('en-US')
  const items = Array.from(element.children)
    .filter((child) => child.tagName.toLocaleLowerCase('en-US') === 'li')
    .map((child) => ({
      html: createCalendarBlocksFromInlineTokens(tokenizeCalendarChildren(child))
        .map((block) => (block.kind === 'paragraph' ? block.html : ''))
        .filter(Boolean)
        .join('<br>'),
      text: normalizeCalendarBlockText(getCalendarNodeText(child)),
    }))
    .filter((item) => item.text)

  if (items.length === 0) {
    return null
  }

  return {
    kind: tagName === 'ol' ? 'ordered-list' : 'unordered-list',
    items,
  }
}

function parseHtmlCalendarBlocks(value: string) {
  const parsedDocument = new DOMParser().parseFromString(value, 'text/html')
  const blocks: CalendarRichBlock[] = []
  let inlineNodes: Node[] = []

  function flushInlineNodes() {
    if (inlineNodes.length === 0) {
      return
    }

    const fragment = parsedDocument.createElement('span')
    inlineNodes.forEach((node) => fragment.append(node.cloneNode(true)))
    blocks.push(...createCalendarParagraphBlocks(fragment))
    inlineNodes = []
  }

  function processNode(node: Node) {
    if (isCalendarTextNode(node)) {
      if (node.textContent) {
        inlineNodes.push(node)
      }

      return
    }

    if (!isCalendarElement(node)) {
      return
    }

    const tagName = node.tagName.toLocaleLowerCase('en-US')

    if (tagName === 'script' || tagName === 'style') {
      return
    }

    if (tagName === 'ul' || tagName === 'ol') {
      flushInlineNodes()
      const listBlock = createCalendarListBlock(node)

      if (listBlock) {
        blocks.push(listBlock)
      }

      return
    }

    if (calendarDescriptionBlockTags.has(tagName)) {
      flushInlineNodes()

      const nestedBlockChildren = Array.from(node.childNodes).filter(
        (child) =>
          isCalendarElement(child) &&
          (calendarDescriptionBlockTags.has(child.tagName.toLocaleLowerCase('en-US')) ||
            child.tagName.toLocaleLowerCase('en-US') === 'ul' ||
            child.tagName.toLocaleLowerCase('en-US') === 'ol'),
      )

      if (nestedBlockChildren.length > 0) {
        Array.from(node.childNodes).forEach(processNode)
        flushInlineNodes()
        return
      }

      blocks.push(...createCalendarParagraphBlocks(node))
      return
    }

    inlineNodes.push(node)
  }

  Array.from(parsedDocument.body.childNodes).forEach(processNode)
  flushInlineNodes()

  return blocks
}

function getCalendarRichBlocks(value?: string) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return []
  }

  if (!trimmedValue.includes('<')) {
    return createPlainTextCalendarBlocks(trimmedValue)
  }

  return parseHtmlCalendarBlocks(trimmedValue)
}

function getCalendarBlockText(block: CalendarRichBlock) {
  if (block.kind === 'paragraph') {
    return block.text
  }

  if (block.kind === 'spacer') {
    return ''
  }

  return block.items.map((item) => item.text).join('\n')
}

function getCalendarBlocksText(blocks: CalendarRichBlock[]) {
  return blocks
    .map(getCalendarBlockText)
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractCalendarNoteMetadata(blocks: CalendarRichBlock[]): CalendarDescriptionMetadata {
  let slug: string | undefined
  const visibleBlocks = blocks
    .map((block): CalendarRichBlock | null => {
      if (block.kind === 'paragraph') {
        const slugLine = block.text.match(/^\s*(?:slug|event-slug)\s*:\s*(.+?)\s*$/i)

        if (slugLine) {
          slug = slug ?? createEventSlug(slugLine[1])
          return null
        }

        return block
      }

      if (block.kind === 'spacer') {
        return block
      }

      const items = block.items.filter((item) => {
        const slugLine = item.text.match(/^\s*(?:slug|event-slug)\s*:\s*(.+?)\s*$/i)

        if (!slugLine) {
          return true
        }

        slug = slug ?? createEventSlug(slugLine[1])
        return false
      })

      return items.length > 0 ? { ...block, items } : null
    })
    .filter((block): block is CalendarRichBlock => block !== null)

  return {
    blocks: visibleBlocks,
    text: getCalendarBlocksText(visibleBlocks),
    slug,
  }
}

function stripLanguageLabelFromBlock(
  block: CalendarRichBlock,
  languageBlock: RegExpMatchArray,
): CalendarRichParagraphBlock | null {
  if (block.kind !== 'paragraph') {
    return null
  }

  return createPlainTextParagraphBlock(languageBlock[2] ?? '')
}

function getLocalizedCalendarBlocks(blocks: CalendarRichBlock[], language: Language) {
  const localizedBlocks: Partial<Record<Language, CalendarRichBlock[]>> = {}
  let activeLanguage: Language | null = null
  let hasLocalizedBlock = false

  blocks.forEach((block) => {
    const languageBlock =
      block.kind === 'paragraph'
        ? block.text.match(/^\s*(pl|en)\s*:\s*(.*)$/i)
        : null

    if (languageBlock) {
      hasLocalizedBlock = true
      activeLanguage = languageBlock[1].toLocaleLowerCase('en-US') as Language
      localizedBlocks[activeLanguage] = localizedBlocks[activeLanguage] ?? []

      const strippedBlock = stripLanguageLabelFromBlock(block, languageBlock)

      if (strippedBlock) {
        localizedBlocks[activeLanguage]?.push(strippedBlock)
      }

      return
    }

    if (activeLanguage) {
      localizedBlocks[activeLanguage] = localizedBlocks[activeLanguage] ?? []
      localizedBlocks[activeLanguage]?.push(block)
    }
  })

  if (!hasLocalizedBlock) {
    return blocks
  }

  const requestedBlocks = localizedBlocks[language]

  if (requestedBlocks && requestedBlocks.length > 0) {
    return requestedBlocks
  }

  return localizedBlocks[defaultLanguage] ?? blocks
}

function normalizeEventSearchText(value: string) {
  return value.toLocaleLowerCase('pl-PL')
}

function includesEventKeyword(value: string, keywords: string[]) {
  const normalizedValue = normalizeEventSearchText(value)
  return keywords.some((keyword) => normalizedValue.includes(keyword))
}

function getCalendarEventHighlight(title: string, source: EventSource): EventHighlight | undefined {
  if (
    source === 'birthday-calendar' ||
    includesEventKeyword(title, ['urodziny', 'birthday'])
  ) {
    return {
      kind: 'birthday',
      accent: birthdayEventAccent,
    }
  }

  if (title.includes('!')) {
    return {
      kind: 'important',
      accent: importantEventAccent,
    }
  }

  return undefined
}

function getDisplayCalendarEventTitle(
  title: string,
  eventHighlight: EventHighlight | undefined,
  language: Language,
) {
  if (eventHighlight?.kind === 'birthday') {
    return translate(calendarEventHighlightText.birthday, language)
  }

  if (eventHighlight?.kind === 'important') {
    return title.replace(/!/g, '').replace(/\s{2,}/g, ' ').trim() || title
  }

  return title.trim() || title
}

function isValidHexColor(value?: string): value is string {
  return /^#[\da-f]{6}$/i.test(value ?? '')
}

function getValidCalendarEventColor(color?: GoogleCalendarColor): CalendarEventColor | undefined {
  const background = color?.background

  if (!isValidHexColor(background)) {
    return undefined
  }

  const foreground = color?.foreground

  return {
    background,
    foreground: isValidHexColor(foreground) ? foreground : undefined,
  }
}

function mapGoogleCalendarAttachments(
  attachments: GoogleCalendarAttachment[] | undefined,
  language: Language,
) {
  return (attachments ?? [])
    .map((attachment, index): CalendarEventAttachment | null => {
      const url = sanitizeCalendarUrl(attachment.fileUrl)

      if (!url) {
        return null
      }

      const title =
        normalizeCalendarText(attachment.title) ||
        `${translate(scheduleText.attachmentFallbackTitle, language)} ${index + 1}`
      const iconUrl = sanitizeCalendarUrl(attachment.iconLink)

      return {
        id: attachment.fileId ?? `${url}-${index}`,
        title: formatLocalizedText(title, language),
        url,
        mimeType: normalizeCalendarText(attachment.mimeType) || undefined,
        iconUrl,
      }
    })
    .filter((attachment): attachment is CalendarEventAttachment => attachment !== null)
}

function mapGoogleCalendarEvent(
  event: GoogleCalendarEvent,
  index: number,
  language: Language,
  source: EventSource,
  calendarId: string,
  eventColors: CalendarEventColorMap,
): UpcomingEvent | null {
  if (event.status === 'cancelled') {
    return null
  }

  const start = parseGoogleEventDate(event.start)

  if (!start) {
    return null
  }

  const end = parseGoogleEventDate(event.end)
  const rawTitle =
    normalizeCalendarText(event.summary) || translate(scheduleText.untitledEvent, language)
  const isNotice = isNoticeCalendarTitle(rawTitle)
  const displayTitle = isNotice ? getNoticeCalendarTitle(rawTitle, language) : rawTitle
  const eventHighlight: EventHighlight | undefined = isNotice
    ? {
        kind: 'important',
        accent: importantEventAccent,
      }
    : getCalendarEventHighlight(displayTitle, source)
  const title = formatLocalizedText(
    getDisplayCalendarEventTitle(displayTitle, eventHighlight, language),
    language,
  )
  const location = formatLocalizedText(normalizeCalendarText(event.location), language)
  const noteMetadata = extractCalendarNoteMetadata(getCalendarRichBlocks(event.description))
  const noteBlocks = isNotice
    ? getLocalizedCalendarBlocks(noteMetadata.blocks, language)
    : noteMetadata.blocks
  const note = getCalendarBlocksText(noteBlocks)
  const attachments = mapGoogleCalendarAttachments(event.attachments, language)
  const hasDetails = Boolean(note) || attachments.length > 0
  const canCreateExpandableSlug =
    !isNotice && eventHighlight?.kind !== 'birthday' && hasDetails
  const slug =
    noteMetadata.slug ??
    (canCreateExpandableSlug
      ? createFallbackEventSlug(rawTitle, start.date)
      : undefined)

  return {
    id: `${calendarId}-${event.id ?? event.iCalUID ?? `${start.date.toISOString()}-${index}`}`,
    date: start.date,
    endDate: end?.date,
    title,
    location: location || undefined,
    note: note || undefined,
    noteBlocks: noteBlocks.length > 0 ? noteBlocks : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
    slug,
    isAllDay: start.isAllDay,
    source,
    eventColor: event.colorId ? eventColors[event.colorId] : undefined,
    eventHighlight,
    isNotice,
  }
}

async function fetchGoogleCalendarColors(apiKey: string): Promise<CalendarEventColorMap> {
  const url = new URL('https://www.googleapis.com/calendar/v3/colors')
  url.searchParams.set('key', apiKey)

  const response = await fetch(url)
  const data = (await response.json()) as GoogleCalendarColorsResponse

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Google Calendar colors request failed')
  }

  return Object.fromEntries(
    Object.entries(data.event ?? {})
      .map(([colorId, color]) => [colorId, getValidCalendarEventColor(color)] as const)
      .filter((entry): entry is readonly [string, CalendarEventColor] => entry[1] !== undefined),
  )
}

async function fetchGoogleCalendarEvents(
  calendar: GoogleCalendarConfig['calendars'][number],
  apiKey: string,
  language: Language,
  eventColors: CalendarEventColorMap,
): Promise<UpcomingEvent[]> {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 3)

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendarId)}/events`,
  )
  url.searchParams.set('key', apiKey)
  url.searchParams.set('timeMin', now.toISOString())
  url.searchParams.set('timeMax', endDate.toISOString())
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('showDeleted', 'false')
  url.searchParams.set('maxResults', '250')

  const response = await fetch(url)
  const data = (await response.json()) as GoogleCalendarResponse

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Google Calendar request failed')
  }

  return (data.items ?? [])
    .map((event, index) =>
      mapGoogleCalendarEvent(
        event,
        index,
        language,
        calendar.source,
        calendar.calendarId,
        eventColors,
      ),
    )
    .filter((event): event is UpcomingEvent => event !== null)
    .sort((first, second) => first.date.getTime() - second.date.getTime())
}

async function fetchConfiguredCalendarEvents(
  config: GoogleCalendarConfig,
  language: Language,
): Promise<UpcomingEvent[]> {
  const eventColors = await fetchGoogleCalendarColors(config.apiKey).catch(() => ({}))
  const calendarResults = await Promise.allSettled(
    config.calendars.map((calendar) =>
      fetchGoogleCalendarEvents(calendar, config.apiKey, language, eventColors),
    ),
  )
  const successfulEvents = calendarResults.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  )

  if (successfulEvents.length === 0 && calendarResults.some((result) => result.status === 'rejected')) {
    throw new Error('Google Calendar requests failed')
  }

  return successfulEvents.sort((first, second) => first.date.getTime() - second.date.getTime())
}

function getEventCardStyle(event: UpcomingEvent): EventCardStyle | undefined {
  const accent = event.eventHighlight?.accent ?? event.eventColor?.background

  if (!accent) {
    return undefined
  }

  return {
    '--event-accent': accent,
  }
}

function groupEventsByMonth(events: UpcomingEvent[], language: Language) {
  const groups = new Map<string, UpcomingEvent[]>()

  events.forEach((event) => {
    const month = formatMonth(event.date, language)
    const monthEvents = groups.get(month) ?? []
    monthEvents.push(event)
    groups.set(month, monthEvents)
  })

  return Array.from(groups.entries()).map(([month, monthEvents]) => ({
    month,
    events: monthEvents,
  }))
}

function splitCalendarEvents(events: UpcomingEvent[]) {
  return {
    noticeEvents: events.filter((event) => event.isNotice),
    scheduleEvents: events.filter((event) => !event.isNotice),
  }
}

function Header({
  activePage,
  language,
  setLanguage,
  theme,
  setTheme,
}: {
  activePage: PageKey
  language: Language
  setLanguage: (language: Language) => void
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className={isMenuOpen ? 'site-header is-menu-open' : 'site-header'}>
      <div className="content-width header-inner">
        <a className="brand-link" href={withBasePath('/')} aria-label="Scholka Aureolka">
          <img className="brand-logo" src={withBasePath(getLogoForTheme(theme, 'header'))} alt="" />
          <span>
            <strong>Scholka Aureolka</strong>
            <small>{translate(commonText.siteKicker, language)}</small>
          </span>
        </a>

        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          aria-label={translate(isMenuOpen ? commonText.closeMenu : commonText.openMenu, language)}
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
        >
          <span className="menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav id="site-menu" className="main-nav" aria-label={translate(commonText.mainNavigation, language)}>
          {navigationItems.map((item) => (
            <a
              key={item.key}
              className="nav-link"
              href={withBasePath(item.href)}
              aria-current={activePage === item.key ? 'page' : undefined}
            >
              {translate(item.label, language)}
            </a>
          ))}
        </nav>

        <div className="header-controls" aria-label={translate(commonText.sitePreferences, language)}>
          <div className="segmented-control" aria-label={translate(commonText.languageLabel, language)}>
            {languageOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className="segment-button"
                aria-pressed={language === option.key}
                onClick={() => setLanguage(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="theme-switch">
            <span className="visually-hidden">{translate(commonText.darkThemeToggle, language)}</span>
            <input
              type="checkbox"
              role="switch"
              checked={theme === 'dark'}
              onChange={(event) => setTheme(event.currentTarget.checked ? 'dark' : 'light')}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb">
                <img src={withBasePath(getLogoForTheme(theme, 'purple'))} alt="" />
              </span>
            </span>
          </label>
        </div>
      </div>
    </header>
  )
}

function PageHeading({ page, language }: { page: PageKey; language: Language }) {
  const intro = pageIntro[page]

  return (
    <section className="page-heading">
      <div className="content-width narrow">
        <p className="eyebrow">{translate(intro.eyebrow, language)}</p>
        <h1>{translate(intro.title, language)}</h1>
        {intro.lead && <p>{translate(intro.lead, language)}</p>}
      </div>
    </section>
  )
}

function HeroScheduleRibbon({ language }: { language: Language }) {
  return (
    <div className="hero-schedule-ribbon" aria-label={translate(commonText.schedule, language)}>
      <div className="hero-ribbon-line">
        <span>{translate(homeHeroText.rehearsalsLabel, language)}</span>
        <strong>
          {homeScheduleCards.map((card) => translate(card.time, language)).join(' / ')}
        </strong>
      </div>
      <div className="hero-ribbon-line">
        <span>{translate(homeHeroText.massLabel, language)}</span>
        <strong>{translate(childrenMassCard.time, language)}</strong>
      </div>
    </div>
  )
}

function CopyLinkIcon({ isCopied }: { isCopied: boolean }) {
  return (
    <svg
      className="event-action-icon"
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

function stopCalendarLinkPropagation(mouseEvent: ReactMouseEvent<HTMLElement>) {
  if ((mouseEvent.target as HTMLElement).closest('a')) {
    mouseEvent.stopPropagation()
  }
}

function CalendarRichContent({
  blocks,
  language,
  className = 'calendar-rich-text',
}: {
  blocks: CalendarRichBlock[] | undefined
  language: Language
  className?: string
}) {
  if (!blocks || blocks.length === 0) {
    return null
  }

  return (
    <div className={className} onClick={stopCalendarLinkPropagation}>
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          return (
            <p
              key={index}
              dangerouslySetInnerHTML={{ __html: formatLocalizedHtml(block.html, language) }}
            />
          )
        }

        if (block.kind === 'spacer') {
          return <div className="calendar-rich-space" key={index} aria-hidden="true" />
        }

        const ListTag = block.kind === 'ordered-list' ? 'ol' : 'ul'

        return (
          <ListTag key={index}>
            {block.items.map((item, itemIndex) => (
              <li
                key={`${index}-${itemIndex}`}
                dangerouslySetInnerHTML={{ __html: formatLocalizedHtml(item.html, language) }}
              />
            ))}
          </ListTag>
        )
      })}
    </div>
  )
}

function AttachmentList({
  attachments,
  language,
  className = 'event-attachments',
}: {
  attachments: CalendarEventAttachment[] | undefined
  language: Language
  className?: string
}) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className={className} onClick={stopCalendarLinkPropagation}>
      <p className="event-attachments-title">{translate(scheduleText.attachmentsLabel, language)}</p>
      <ul>
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <a href={attachment.url} target="_blank" rel="noreferrer">
              {attachment.iconUrl && <img src={attachment.iconUrl} alt="" />}
              <span>{attachment.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EventList({
  events,
  language,
  compact = false,
  expandable = false,
  showDetailSymbols = expandable,
  expandedEventId = null,
  linkedEventId = null,
  copiedEventId = null,
  getEventHref,
  onExpandedEventChange,
  onEventLinkCopy,
}: {
  events: UpcomingEvent[]
  language: Language
  compact?: boolean
  expandable?: boolean
  showDetailSymbols?: boolean
  expandedEventId?: string | null
  linkedEventId?: string | null
  copiedEventId?: string | null
  getEventHref?: (event: UpcomingEvent) => string
  onExpandedEventChange?: (eventId: string | null) => void
  onEventLinkCopy?: (event: UpcomingEvent) => void
}) {
  return (
    <div className={compact ? 'event-list compact' : 'event-list'}>
      {events.map((event) => {
        const eventHighlight = event.eventHighlight
        const isBirthdayEvent = eventHighlight?.kind === 'birthday'
        const isImportantEvent = eventHighlight?.kind === 'important'
        const hasEventDetails = isExpandableScheduleEvent(event)
        const canExpandEvent = expandable && hasEventDetails
        const shouldShowDetailSymbol = showDetailSymbols && hasEventDetails
        const isExpanded = canExpandEvent && expandedEventId === event.id
        const isLinked = linkedEventId === event.id
        const detailsId = `event-details-${event.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
        const canCopyEventLink = canExpandEvent && Boolean(event.slug)
        const isCopied = copiedEventId === event.id
        const eventHref = getEventHref?.(event)
        const eventCardClassName = [
          'event-card',
          eventHref ? 'event-card-link' : '',
          isBirthdayEvent ? 'event-card--birthday' : '',
          isImportantEvent ? 'event-card--important' : '',
          shouldShowDetailSymbol ? 'has-details' : '',
          isExpanded ? 'is-expanded' : '',
          isLinked ? 'is-linked' : '',
        ]
          .filter(Boolean)
          .join(' ')

        function toggleEvent() {
          if (!canExpandEvent || !onExpandedEventChange) {
            return
          }

          onExpandedEventChange(isExpanded ? null : event.id)
        }

        function handleEventKeyDown(keyboardEvent: ReactKeyboardEvent<HTMLElement>) {
          if (keyboardEvent.target !== keyboardEvent.currentTarget) {
            return
          }

          if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
            return
          }

          keyboardEvent.preventDefault()
          toggleEvent()
        }

        function handleCopyEventLink(mouseEvent: ReactMouseEvent<HTMLButtonElement>) {
          mouseEvent.stopPropagation()

          if (!canCopyEventLink || !onEventLinkCopy) {
            return
          }

          onEventLinkCopy(event)
        }

        const eventCardContent = (
          <>
            <div className="event-card-summary">
              <div className="event-date">
                <strong>{formatEventDate(event.date, language)}</strong>
                <span>
                  {event.isAllDay
                    ? translate(scheduleText.allDay, language)
                    : formatEventTime(event.date, language)}
                </span>
              </div>
              <div className="event-body">
                <div className="event-title-row">
                  <h3>{event.title}</h3>
                  <div className="event-title-actions">
                    {isBirthdayEvent && (
                      <span
                        className="event-birthday-cake"
                        role="img"
                        aria-label={translate(calendarEventHighlightText.birthday, language)}
                      >
                        {'\uD83C\uDF82'}
                      </span>
                    )}
                    {canCopyEventLink && (
                      <button
                        type="button"
                        className={
                          isCopied
                            ? 'event-action-button event-copy-link-button is-copied'
                            : 'event-action-button event-copy-link-button'
                        }
                        aria-label={`${translate(
                          isCopied ? scheduleText.eventLinkCopied : scheduleText.copyEventLink,
                          language,
                        )}: ${event.title}`}
                        onClick={handleCopyEventLink}
                      >
                        <CopyLinkIcon isCopied={isCopied} />
                      </button>
                    )}
                    {shouldShowDetailSymbol && (
                      <span
                        className="event-expand-status-icon"
                        aria-label={translate(scheduleText.eventInfoLabel, language)}
                      >
                        {isExpanded ? '-' : '+'}
                      </span>
                    )}
                  </div>
                </div>
                {event.location && <p className="muted">{event.location}</p>}
                {!compact && !expandable && !eventHref && (
                  <>
                    <CalendarRichContent
                      blocks={event.noteBlocks}
                      language={language}
                      className="event-summary-note calendar-rich-text"
                    />
                    <AttachmentList attachments={event.attachments} language={language} />
                  </>
                )}
              </div>
            </div>

            {canExpandEvent && isExpanded && (
              <div className="event-details" id={detailsId}>
                {event.location && (
                  <dl className="event-detail-list">
                    <div>
                      <dt>{translate(scheduleText.whereLabel, language)}</dt>
                      <dd>{event.location}</dd>
                    </div>
                  </dl>
                )}
                <CalendarRichContent
                  blocks={event.noteBlocks}
                  language={language}
                  className="event-detail-note calendar-rich-text"
                />
                <AttachmentList attachments={event.attachments} language={language} />
              </div>
            )}
          </>
        )

        if (eventHref) {
          return (
            <a
              className={eventCardClassName}
              key={event.id}
              id={getEventDomId(event)}
              href={eventHref}
              style={getEventCardStyle(event)}
            >
              {eventCardContent}
            </a>
          )
        }

        return (
          <article
            className={eventCardClassName}
            key={event.id}
            id={getEventDomId(event)}
            style={getEventCardStyle(event)}
            role={canExpandEvent ? 'button' : undefined}
            tabIndex={canExpandEvent ? 0 : undefined}
            aria-expanded={canExpandEvent ? isExpanded : undefined}
            aria-controls={canExpandEvent ? detailsId : undefined}
            aria-label={
              canExpandEvent
                ? `${translate(
                    isExpanded ? scheduleText.collapseEvent : scheduleText.expandEvent,
                    language,
                  )}: ${event.title}`
                : undefined
            }
            onClick={canExpandEvent ? toggleEvent : undefined}
            onKeyDown={canExpandEvent ? handleEventKeyDown : undefined}
          >
            {eventCardContent}
          </article>
        )
      })}
    </div>
  )
}

function ImportantNotice({
  language,
  notices,
}: {
  language: Language
  notices: UpcomingEvent[]
}) {
  if (notices.length === 0) {
    return null
  }

  return (
    <div
      className="important-notice-stack"
      role="status"
      aria-label={translate(noticeText.listLabel, language)}
    >
      {notices.map((notice) => (
        <article className="important-notice" key={notice.id}>
          <strong>{notice.title}</strong>
          <CalendarRichContent
            blocks={notice.noteBlocks}
            language={language}
            className="important-notice-body calendar-rich-text"
          />
          <AttachmentList
            attachments={notice.attachments}
            language={language}
            className="important-notice-attachments event-attachments"
          />
        </article>
      ))}
    </div>
  )
}

function GalleryStatusMessage({
  status,
  children,
}: {
  status: GalleryLoadStatus | 'warning'
  children: string
}) {
  return (
    <p className={`gallery-status ${status}`} role="status">
      {children}
    </p>
  )
}

function AlbumGrid({
  albums,
  language,
  onAlbumSelect,
}: {
  albums: GalleryAlbum[]
  language: Language
  onAlbumSelect: (albumSlug: string) => void
}) {
  return (
    <div className="card-grid album-grid">
      {albums.map((album) => {
        const albumTitle = translate(album.title, language)
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
              {album.coverPhoto ? (
                <img src={album.coverPhoto.thumbnailUrl} alt="" loading="lazy" />
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
}: {
  album: GalleryAlbum
  language: Language
  photoCount?: number
  onBack: () => void
}) {
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
  language,
  photos,
  onPhotoSelect,
}: {
  album: GalleryAlbum
  language: Language
  photos: GalleryPhoto[]
  onPhotoSelect: (photoId: string) => void
}) {
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
            <img src={photo.thumbnailUrl} alt={photoAlt} loading="lazy" />
          </a>
        )
      })}
    </div>
  )
}

function GalleryLightbox({
  album,
  language,
  photos,
  photoId,
  onClose,
  onPhotoSelect,
}: {
  album: GalleryAlbum
  language: Language
  photos: GalleryPhoto[]
  photoId: string
  onClose: () => void
  onPhotoSelect: (photoId: string) => void
}) {
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
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [nextPhoto, onClose, onPhotoSelect, previousPhoto])

  if (!photo) {
    return null
  }

  return (
    <div
      className="gallery-lightbox-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="gallery-lightbox"
        role="dialog"
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
          <img src={photo.largeUrl} alt={getGalleryPhotoAlt(album, language)} />
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
      </section>
    </div>
  )
}

function FirstStepsModal({
  language,
  onClose,
}: {
  language: Language
  onClose: () => void
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="parent-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-steps-title"
      >
        <button
          type="button"
          className="modal-close"
          aria-label={translate(commonText.closeModal, language)}
          onClick={onClose}
          autoFocus
        >
          X
        </button>
        <div className="modal-heading">
          <h2 id="first-steps-title">{translate(firstStepsModal.title, language)}</h2>
        </div>
        <ul className="parent-info-list">
          {firstStepsModal.items.map((item) => (
            <li key={translate(item.title, language)}>
              <strong>{translate(item.title, language)}</strong>
              {item.body && <span>{translate(item.body, language)}</span>}
              {item.note && <em className="parent-info-note">{translate(item.note, language)}</em>}
              {item.bodyLink && (
                <span>
                  {translate(item.bodyLink.prefix, language)}
                  <a
                    className="parent-info-inline-link"
                    href={withBasePath(item.bodyLink.href)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {translate(item.bodyLink.label, language)}
                  </a>
                  {item.bodyLink.suffix && translate(item.bodyLink.suffix, language)}
                </span>
              )}
              {item.details && (
                <div className="parent-info-detail-list">
                  {item.details.map((detail) => (
                    <div className="parent-info-detail" key={translate(detail.title, language)}>
                      <b>{translate(detail.title, language)}</b>
                      <span>{translate(detail.body, language)}</span>
                    </div>
                  ))}
                </div>
              )}
              {item.link && (
                <a
                  className={
                    item.link.tone === 'strong'
                      ? 'parent-info-link strong'
                      : 'parent-info-link'
                  }
                  href={withBasePath(item.link.href)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {translate(item.link.label, language)}
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function HomePage({
  language,
  theme,
  noticeEvents,
  upcomingEvents,
}: {
  language: Language
  theme: ThemeName
  noticeEvents: UpcomingEvent[]
  upcomingEvents: UpcomingEvent[]
}) {
  const [isFirstStepsOpen, setIsFirstStepsOpen] = useState(false)

  return (
    <>
      <section className="hero-band">
        <div className="content-width hero-layout">
          <div className="hero-copy">
            <h1>Scholka Aureolka</h1>
            <p className="hero-description">{translate(homeHeroText.description, language)}</p>

            <div className="hero-info-block">
              <HeroScheduleRibbon language={language} />

              <div className="hero-actions" aria-label={translate(commonText.quickLinks, language)}>
                <a className="button primary" href={withBasePath(homeHeroCta.schedule.href)}>
                  {translate(homeHeroCta.schedule.label, language)}
                </a>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setIsFirstStepsOpen(true)}
                >
                  {translate(homeHeroCta.firstSteps.label, language)}
                </button>
              </div>
            </div>
          </div>
          <img
            className="hero-logo-mark"
            src={withBasePath(getLogoForTheme(theme, 'purple'))}
            alt=""
            aria-hidden="true"
          />
        </div>
      </section>

      <section
        className="content-section section-muted home-upcoming-section"
        aria-label={translate(commonText.upcoming, language)}
      >
        <div className="content-width home-upcoming-inner">
          <ImportantNotice language={language} notices={noticeEvents} />
          <EventList
            events={upcomingEvents.slice(0, 4)}
            language={language}
            compact
            getEventHref={getHomeEventHref}
            showDetailSymbols
          />
        </div>
      </section>
      {isFirstStepsOpen && (
        <FirstStepsModal language={language} onClose={() => setIsFirstStepsOpen(false)} />
      )}
    </>
  )
}

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
                  language={language}
                  photos={activePhotos}
                  onPhotoSelect={(nextPhotoId) => selectPhoto(nextPhotoId)}
                />
              )}

              {activePhoto && photoId && (
                <GalleryLightbox
                  album={activeAlbum}
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
              language={language}
              onAlbumSelect={(nextAlbumSlug) => selectAlbum(nextAlbumSlug)}
            />
          ) : null}
        </div>
      </section>
    </>
  )
}

function SchedulePage({
  language,
  upcomingEvents,
  calendarStatus,
}: {
  language: Language
  upcomingEvents: UpcomingEvent[]
  calendarStatus: CalendarLoadStatus
}) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [linkedEventSlug, setLinkedEventSlug] = useState<string | null>(getEventSlugFromLocation)
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null)
  const groupedEvents = groupEventsByMonth(upcomingEvents, language)
  const linkedEvent = linkedEventSlug
    ? upcomingEvents.find((event) => event.slug === linkedEventSlug)
    : undefined
  const stateExpandedEventId = upcomingEvents.some((event) => event.id === expandedEventId)
    ? expandedEventId
    : null
  const linkedExpandedEventId =
    linkedEvent && isExpandableScheduleEvent(linkedEvent) ? linkedEvent.id : null
  const activeExpandedEventId = linkedExpandedEventId ?? stateExpandedEventId
  const linkedEventId = linkedEvent?.id ?? null

  const statusMessage =
    calendarStatus === 'loading'
      ? scheduleText.loading
      : calendarStatus === 'error'
        ? scheduleText.errorNotice
        : calendarStatus === 'unconfigured'
          ? scheduleText.notConfiguredNotice
          : null
  const shouldShowEmptyState = calendarStatus === 'ready' && upcomingEvents.length === 0
  const shouldShowMissingLinkedEvent =
    calendarStatus === 'ready' && Boolean(linkedEventSlug) && !linkedEvent

  function handleExpandedEventChange(eventId: string | null) {
    setExpandedEventId(eventId)

    if (linkedEventSlug) {
      setLinkedEventSlug(null)
      replaceScheduleEventUrl(null)
    }
  }

  function copyEventLink(event: UpcomingEvent) {
    if (!event.slug) {
      return
    }

    copyTextToClipboard(getAbsoluteScheduleEventHref(event.slug))
      .then(() => setCopiedEventId(event.id))
      .catch(() => setCopiedEventId(null))
  }

  useEffect(() => {
    function handlePopState() {
      setLinkedEventSlug(getEventSlugFromLocation())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!linkedEvent) {
      return
    }

    const scrollTimeout = window.setTimeout(() => {
      document
        .getElementById(getEventDomId(linkedEvent))
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 0)

    return () => {
      window.clearTimeout(scrollTimeout)
    }
  }, [linkedEvent])

  return (
    <>
      <PageHeading page="schedule" language={language} />
      <section className="content-section">
        <div className="content-width narrow month-list">
          {statusMessage && (
            <p className={`schedule-status ${calendarStatus}`} role="status">
              {translate(statusMessage, language)}
            </p>
          )}

          {shouldShowMissingLinkedEvent && (
            <p className="schedule-status warning" role="status">
              {translate(scheduleText.eventLinkNotFound, language)}
            </p>
          )}

          {shouldShowEmptyState ? (
            <p className="schedule-empty">{translate(scheduleText.emptyState, language)}</p>
          ) : upcomingEvents.length > 0 ? (
            groupedEvents.map((group, index) => {
              const headingId = `month-${index}`

              return (
                <section className="month-group" key={group.month} aria-labelledby={headingId}>
                  <h2 id={headingId}>{group.month}</h2>
                  <EventList
                    events={group.events}
                    language={language}
                    expandable
                    expandedEventId={activeExpandedEventId}
                    linkedEventId={linkedEventId}
                    copiedEventId={copiedEventId}
                    onExpandedEventChange={handleExpandedEventChange}
                    onEventLinkCopy={copyEventLink}
                  />
                </section>
              )
            })
          ) : null}
        </div>
      </section>
    </>
  )
}

function ContactPage({ language }: { language: Language }) {
  return (
    <>
      <PageHeading page="contact" language={language} />
      <section className="content-section">
        <div className="content-width contact-layout">
          <div className="contact-copy">
            <div className="contact-people">
              {contactDetails.people.map((person, index) => {
                const HeadingTag = index === 0 ? 'h2' : 'h3'

                return (
                  <section className="contact-person" key={translateOptional(person.name, defaultLanguage)}>
                    <p className="eyebrow">{translate(person.role, language)}</p>
                    <HeadingTag>{translateOptional(person.name, language)}</HeadingTag>
                  </section>
                )
              })}
            </div>
          </div>
          <nav className="contact-links" aria-labelledby="contact-links-heading">
            <p id="contact-links-heading" className="contact-links-heading">
              {translate(contactDetails.linksLabel, language)}
            </p>
            <div className="contact-link-actions">
              {contactDetails.links.map((link) => (
                <a
                  key={link.href}
                  className="contact-link"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{translateOptional(link.label, language)}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      </section>
    </>
  )
}

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="content-width footer-inner">
        <div>
          <strong>Scholka Aureolka</strong>
          <p lang="la">{footerQuote}</p>
        </div>
        <dl className="footer-credits" aria-label="Site credits">
          {footerCredits.map((credit) => (
            <div className="footer-credit" key={credit.label}>
              <dt>{credit.label}</dt>
              <dd>{credit.value}</dd>
            </div>
          ))}
        </dl>
        <p className="footer-meta">© {year}</p>
      </div>
    </footer>
  )
}

function App() {
  const googleCalendarConfig = useMemo(() => getGoogleCalendarConfig(), [])
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme)
  const [calendarState, setCalendarState] = useState<CalendarState>({
    status: googleCalendarConfig ? 'loading' : 'unconfigured',
    events: [],
  })
  const activePage = getPageFromPath(window.location.pathname)
  const { noticeEvents, scheduleEvents } = useMemo(
    () => splitCalendarEvents(calendarState.events),
    [calendarState.events],
  )

  useEffect(() => {
    if (!googleCalendarConfig) {
      return
    }

    let isActive = true

    fetchConfiguredCalendarEvents(googleCalendarConfig, language)
      .then((events) => {
        if (!isActive) {
          return
        }

        setCalendarState({
          status: 'ready',
          events,
        })
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setCalendarState({
          status: 'error',
          events: [],
        })
      })

    return () => {
      isActive = false
    }
  }, [googleCalendarConfig, language])

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem(languageStorageKey, language)
  }, [language])

  useEffect(() => {
    const navigationItem = navigationItems.find((item) => item.key === activePage)
    document.title =
      activePage === 'home' || !navigationItem
        ? 'Scholka Aureolka'
        : `${translate(navigationItem.label, language)} | Scholka Aureolka`
  }, [activePage, language])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        {translate(commonText.skipToContent, language)}
      </a>
      <Header
        activePage={activePage}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
      <main id="main-content">
        {activePage === 'home' && (
          <HomePage
            language={language}
            theme={theme}
            noticeEvents={noticeEvents}
            upcomingEvents={scheduleEvents}
          />
        )}
        {activePage === 'gallery' && <GalleryPage language={language} />}
        {activePage === 'schedule' && (
          <SchedulePage
            language={language}
            upcomingEvents={scheduleEvents}
            calendarStatus={calendarState.status}
          />
        )}
        {activePage === 'contact' && <ContactPage language={language} />}
      </main>
      <Footer />
    </div>
  )
}

export default App
