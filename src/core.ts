import type { CSSProperties } from 'react'
import {
  calendarEventHighlightText,
  defaultLanguage,
  galleryText,
  logoPaths,
  navigationItems,
  noticeText,
  scheduleCards,
  scheduleText,
  type Language,
  type LocalizedText,
  type PageKey,
  type ThemeName,
} from './siteContent'

type EventSource = 'google-calendar'

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

type GalleryAlbumKind = 'achievements' | 'standard'

type GalleryAlbum = {
  id: string
  kind: GalleryAlbumKind
  folderName: string
  slug: string
  title: LocalizedText
  date: Date | undefined
  coverPhoto: GalleryPhoto | undefined
}

type GalleryPhoto = {
  id: string
  name: string
  title?: LocalizedText
  date?: Date
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

type GoogleDriveFileResponse = GoogleDriveFile & {
  error?: {
    message?: string
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

type EventRelativeTime = {
  label: string
  progressPercent: number
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

type GoogleFrequencyConfig = {
  apiKey: string
  spreadsheetId: string
}

const languageStorageKey = 'scholka-aureolka-language'
const themeStorageKey = 'scholka-aureolka-theme'
const eventSlugSearchParam = 'event'
const galleryAlbumSearchParam = 'album'
const galleryPhotoSearchParam = 'photo'
const galleryAchievementsFolderId = '1regQdvW8Ebx5sGzXQ-4Goffde-ieW1cs'
const galleryAchievementsAlbumSlug = 'achievements'
const calendarNoticePrefixPattern = /^\s*\[notice]\s*:?\s*/i
const galleryCoverPrefixPattern = /^\s*\[cover]/i
const galleryImageFileExtensionPattern =
  /\.(?:avif|bmp|gif|heic|heif|jpe?g|png|tiff?|webp)$/i
const galleryImageRetryDelays = [450, 1400]
const galleryImageLogoSpinnerMinimumMs = 450
const homeScheduleCards = scheduleCards.slice(0, 2)
const childrenMassCard = scheduleCards[2]
const birthdayEventAccent = 'var(--color-violet)'
const importantEventAccent = 'var(--color-important)'
const polishOneLetterWordPattern = /(^|[\s([{„"'])([AaIiOoUuWwZz])\s+(?=\S)/g

const languageLocale: Record<Language, string> = {
  pl: 'pl-PL',
  en: 'en-US',
}
const emptyGalleryPhotos: GalleryPhoto[] = []
const navigationItemByPage = new Map(navigationItems.map((item) => [item.key, item]))
const navigationItemByPath = new Map(
  navigationItems.map((item) => [normalizePagePath(item.href), item]),
)

function isAsciiDigit(value: string) {
  return value >= '0' && value <= '9'
}

function isAsciiLetter(value: string) {
  return value >= 'a' && value <= 'z'
}

function isWhitespace(value: string) {
  return value.trim() === ''
}

function hasOnlyAsciiDigits(value: string) {
  return value.length > 0 && Array.from(value).every(isAsciiDigit)
}

function stripLeadingCharacter(value: string, character: string) {
  let start = 0

  while (value[start] === character) {
    start += 1
  }

  return value.slice(start)
}

function stripTrailingCharacter(value: string, character: string) {
  let end = value.length

  while (end > 0 && value[end - 1] === character) {
    end -= 1
  }

  return value.slice(0, end)
}

function normalizeLineBreaks(value: string) {
  let normalizedValue = ''

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (character === '\r') {
      normalizedValue += '\n'

      if (value[index + 1] === '\n') {
        index += 1
      }

      continue
    }

    normalizedValue += character
  }

  return normalizedValue
}

function collapseExcessBlankLines(value: string) {
  let normalizedValue = ''
  let newlineCount = 0

  for (const character of value) {
    if (character === '\n') {
      newlineCount += 1

      if (newlineCount <= 2) {
        normalizedValue += character
      }

      continue
    }

    newlineCount = 0
    normalizedValue += character
  }

  return normalizedValue
}

function collapseWhitespaceRuns(value: string) {
  let normalizedValue = ''
  let isInsideWhitespace = false

  for (const character of value) {
    if (isWhitespace(character)) {
      if (!isInsideWhitespace) {
        normalizedValue += ' '
      }

      isInsideWhitespace = true
      continue
    }

    normalizedValue += character
    isInsideWhitespace = false
  }

  return normalizedValue
}

function getBasePath() {
  return import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
}

function withBasePath(path: string) {
  if (path.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(path)) {
    return path
  }

  return `${getBasePath()}${stripLeadingCharacter(path, '/')}`
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
  return new URL(getScheduleEventHref(slug), globalThis.location.origin).href
}

async function copyTextToClipboard(text: string) {
  if (globalThis.navigator.clipboard) {
    await globalThis.navigator.clipboard.writeText(text)
    return
  }

  throw new Error('Clipboard API is unavailable')
}

function removeBasePath(pathname: string) {
  const basePath = new URL(getBasePath(), globalThis.location.origin).pathname

  if (basePath !== '/' && pathname.startsWith(basePath)) {
    return `/${pathname.slice(basePath.length)}`
  }

  return pathname
}

function normalizePagePath(pathname: string) {
  return stripTrailingCharacter(pathname, '/') || '/'
}

function applyPolishNoBreaks(value: string) {
  return value.replace(polishOneLetterWordPattern, `$1$2\u00a0`)
}

function formatHtmlTextSegments(value: string, formatText: (text: string) => string) {
  let formattedValue = ''
  let currentIndex = 0

  while (currentIndex < value.length) {
    const tagStartIndex = value.indexOf('<', currentIndex)

    if (tagStartIndex === -1) {
      formattedValue += formatText(value.slice(currentIndex))
      break
    }

    formattedValue += formatText(value.slice(currentIndex, tagStartIndex))

    const tagEndIndex = value.indexOf('>', tagStartIndex + 1)

    if (tagEndIndex === -1) {
      formattedValue += formatText(value.slice(tagStartIndex))
      break
    }

    formattedValue += value.slice(tagStartIndex, tagEndIndex + 1)
    currentIndex = tagEndIndex + 1
  }

  return formattedValue
}

function formatLocalizedText(value: string, language: Language) {
  return language === 'pl' ? applyPolishNoBreaks(value) : value
}

function formatLocalizedHtml(value: string, language: Language) {
  if (language !== 'pl') {
    return value
  }

  return formatHtmlTextSegments(value, applyPolishNoBreaks)
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
  const apiKey = getGoogleApiKey()
  const calendars: GoogleCalendarConfig['calendars'] = []

  if (calendarId) {
    calendars.push({
      calendarId,
      source: 'google-calendar',
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

function getGoogleFrequencyConfig(): GoogleFrequencyConfig | null {
  const spreadsheetId = import.meta.env.VITE_GOOGLE_FREQUENCY_SHEET_ID?.trim()
  const apiKey = getGoogleApiKey()

  if (!apiKey || !spreadsheetId) {
    return null
  }

  return { apiKey, spreadsheetId }
}

function getInitialLanguage(): Language {
  const storedLanguage = globalThis.localStorage.getItem(languageStorageKey)

  if (storedLanguage === 'pl' || storedLanguage === 'en') {
    return storedLanguage
  }

  return defaultLanguage
}

function getInitialTheme(): ThemeName {
  const storedTheme = globalThis.localStorage.getItem(themeStorageKey)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getPageFromPath(pathname: string): PageKey {
  const path = normalizePagePath(removeBasePath(pathname))

  return navigationItemByPath.get(path)?.key ?? 'home'
}

function getPageDocumentTitle(page: PageKey, language: Language) {
  if (page === 'home') {
    return 'Scholka Aureolka'
  }

  const navigationItem = navigationItemByPage.get(page)

  return navigationItem
    ? `${translate(navigationItem.label, language)} | Scholka Aureolka`
    : 'Scholka Aureolka'
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

const millisecondsPerDay = 24 * 60 * 60 * 1000
const defaultEventRelativeProgressWindowDays = 7

function getLocalDayValue(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseEventRelativeProgressWindowDays(value: string | undefined) {
  const progressWindowDays = Number(value?.trim())

  return Number.isFinite(progressWindowDays) && progressWindowDays > 0
    ? progressWindowDays
    : defaultEventRelativeProgressWindowDays
}

function getEventRelativeProgressWindowDays() {
  return parseEventRelativeProgressWindowDays(
    import.meta.env.VITE_EVENT_PROGRESS_WINDOW_DAYS,
  )
}

function getEventRelativeProgressWindowMs() {
  return getEventRelativeProgressWindowDays() * millisecondsPerDay
}

function translateCountedText(text: LocalizedText, language: Language, count: number) {
  return translate(text, language).replace('{count}', String(count))
}

function formatEventRelativeTime(
  date: Date,
  language: Language,
  referenceDate = new Date(),
) {
  return getEventRelativeTime(date, language, referenceDate)?.label ?? null
}

function getEventRelativeProgressPercent(date: Date, referenceDate: Date) {
  const millisecondsUntilEvent = date.getTime() - referenceDate.getTime()
  const progressWindowMs = getEventRelativeProgressWindowMs()

  if (millisecondsUntilEvent >= progressWindowMs) {
    return 0
  }

  if (millisecondsUntilEvent <= 0) {
    return 100
  }

  return Math.round(
    ((progressWindowMs - millisecondsUntilEvent) / progressWindowMs) * 100,
  )
}

function getEventRelativeTime(
  date: Date,
  language: Language,
  referenceDate = new Date(),
): EventRelativeTime | null {
  const daysUntilEvent = Math.round(
    (getLocalDayValue(date) - getLocalDayValue(referenceDate)) / millisecondsPerDay,
  )

  if (daysUntilEvent < 0) {
    return null
  }

  if (daysUntilEvent === 0) {
    return {
      label: translate(scheduleText.relativeToday, language),
      progressPercent: getEventRelativeProgressPercent(date, referenceDate),
    }
  }

  if (daysUntilEvent === 1) {
    return {
      label: translate(scheduleText.relativeTomorrow, language),
      progressPercent: getEventRelativeProgressPercent(date, referenceDate),
    }
  }

  if (daysUntilEvent < 7) {
    return {
      label: translateCountedText(scheduleText.relativeInDays, language, daysUntilEvent),
      progressPercent: getEventRelativeProgressPercent(date, referenceDate),
    }
  }

  if (daysUntilEvent < 14) {
    return {
      label: translate(scheduleText.relativeInWeek, language),
      progressPercent: getEventRelativeProgressPercent(date, referenceDate),
    }
  }

  if (daysUntilEvent < 45) {
    return {
      label: translateCountedText(
        scheduleText.relativeInWeeks,
        language,
        Math.max(2, Math.round(daysUntilEvent / 7)),
      ),
      progressPercent: getEventRelativeProgressPercent(date, referenceDate),
    }
  }

  if (daysUntilEvent < 75) {
    return {
      label: translate(scheduleText.relativeInMonth, language),
      progressPercent: getEventRelativeProgressPercent(date, referenceDate),
    }
  }

  return {
    label: translateCountedText(
      scheduleText.relativeInMonths,
      language,
      Math.max(2, Math.round(daysUntilEvent / 30)),
    ),
    progressPercent: getEventRelativeProgressPercent(date, referenceDate),
  }
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

function removeCombiningMarks(value: string) {
  let normalizedValue = ''

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0

    if (codePoint < 0x0300 || codePoint > 0x036f) {
      normalizedValue += character
    }
  }

  return normalizedValue
}

function createSlug(value: string) {
  const normalizedValue = removeCombiningMarks(
    value.replaceAll('ł', 'l').replaceAll('Ł', 'l').normalize('NFKD'),
  ).toLocaleLowerCase('pl-PL')
  let slug = ''

  for (const character of normalizedValue) {
    if (isAsciiLetter(character) || isAsciiDigit(character)) {
      slug += character
    } else if (slug && !slug.endsWith('-')) {
      slug += '-'
    }

    if (slug.length >= 96) {
      break
    }
  }

  return stripTrailingCharacter(slug, '-') || undefined
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

function createFallbackEventSlug(title: string, date: Date) {
  return createSlug(`${formatEventSlugDateTime(date)}-${title}`)
}

function parseGalleryFolderDatePrefix(value: string) {
  if (
    value.length < 10 ||
    value[4] !== '-' ||
    value[7] !== '-' ||
    !hasOnlyAsciiDigits(value.slice(0, 4)) ||
    !hasOnlyAsciiDigits(value.slice(5, 7)) ||
    !hasOnlyAsciiDigits(value.slice(8, 10))
  ) {
    return undefined
  }

  const trailingTitle = value.slice(10).trim()
  const titleValue = trailingTitle.startsWith('-')
    ? trailingTitle.slice(1).trim()
    : trailingTitle

  return {
    year: Number(value.slice(0, 4)),
    month: Number(value.slice(5, 7)),
    day: Number(value.slice(8, 10)),
    titleValue: titleValue || value,
  }
}

function splitLocalizedTitle(value: string) {
  const separator = ' -- '
  const separatorIndex = value.indexOf(separator)

  if (separatorIndex === -1) {
    return [value, undefined] as const
  }

  return [
    value.slice(0, separatorIndex),
    value.slice(separatorIndex + separator.length),
  ] as const
}

function createLocalizedGalleryTitle(value: string, fallback: string): LocalizedText {
  const [plTitleValue, enTitleValue] = splitLocalizedTitle(value)
  const plTitle = plTitleValue.trim() || fallback
  const enTitle = enTitleValue?.trim() || plTitle

  return { pl: plTitle, en: enTitle }
}

function parseGalleryDatedLocalizedName(value: string, fallback: string) {
  const trimmedValue = value.trim()
  const parsedDatePrefix = parseGalleryFolderDatePrefix(trimmedValue)
  const titleValue = parsedDatePrefix?.titleValue.trim() || trimmedValue || fallback
  const year = parsedDatePrefix?.year ?? 0
  const month = parsedDatePrefix?.month ?? 0
  const day = parsedDatePrefix?.day ?? 0
  const date = year && month && day ? new Date(year, month - 1, day) : undefined

  return {
    title: createLocalizedGalleryTitle(titleValue, fallback),
    date,
  }
}

function parseGalleryAlbumFolderName(folderName: string) {
  const trimmedFolderName = folderName.trim()

  return parseGalleryDatedLocalizedName(trimmedFolderName, trimmedFolderName)
}

function stripGalleryImageFileExtension(fileName: string) {
  return fileName.replace(galleryImageFileExtensionPattern, '').trim()
}

function stripGalleryPhotoMarkers(fileName: string) {
  return fileName.replace(galleryCoverPrefixPattern, '').trim()
}

function parseGalleryPhotoFileName(fileName: string) {
  const displayName = stripGalleryImageFileExtension(stripGalleryPhotoMarkers(fileName.trim()))

  return parseGalleryDatedLocalizedName(displayName, displayName || fileName)
}

function formatGalleryAlbumDate(album: GalleryAlbum, language: Language) {
  if (album.kind === 'achievements') {
    return translate(galleryText.achievementsAlbumEyebrow, language)
  }

  if (!album.date) {
    return album.folderName
  }

  return new Intl.DateTimeFormat(languageLocale[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(album.date)
}

function shouldUsePolishFewPlural(count: number) {
  const absoluteCount = Math.abs(count)
  const lastDigit = absoluteCount % 10
  const lastTwoDigits = absoluteCount % 100

  return lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)
}

function formatGalleryPhotoCount(count: number, language: Language) {
  if (count === 1) {
    return translate(galleryText.photoCountSingular, language)
  }

  if (language === 'pl' && shouldUsePolishFewPlural(count)) {
    return translate(galleryText.photoCountFew, language).replace('{count}', String(count))
  }

  return translate(galleryText.photoCountPlural, language).replace('{count}', String(count))
}

function formatGalleryPhotoPosition(current: number, total: number, language: Language) {
  return translate(galleryText.photoPosition, language)
    .replace('{current}', String(current))
    .replace('{total}', String(total))
}

function formatGalleryTimelinePhotoDate(photo: GalleryPhoto, language: Language) {
  if (!photo.date) {
    return translate(galleryText.achievementsUndatedGroup, language)
  }

  return new Intl.DateTimeFormat(languageLocale[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(photo.date)
}

function getGalleryPhotoDisplayTitle(photo: GalleryPhoto, language: Language) {
  if (photo.title) {
    return translate(photo.title, language)
  }

  const fallbackTitle = stripGalleryImageFileExtension(stripGalleryPhotoMarkers(photo.name))

  return formatLocalizedText(fallbackTitle || photo.name, language)
}

function getGalleryPhotoAlt(album: GalleryAlbum, language: Language) {
  return translate(galleryText.albumPhotoAlt, language).replace(
    '{album}',
    translate(album.title, language),
  )
}

function getEventSlugFromLocation() {
  const slug = new URLSearchParams(globalThis.location.search).get(eventSlugSearchParam)

  return slug ? createSlug(slug) ?? null : null
}

function getGalleryAlbumSlugFromLocation() {
  const slug = new URLSearchParams(globalThis.location.search).get(galleryAlbumSearchParam)

  return slug ? createSlug(slug) ?? null : null
}

function getGalleryPhotoIdFromLocation() {
  return new URLSearchParams(globalThis.location.search).get(galleryPhotoSearchParam)
}

function replaceScheduleEventUrl(slug: string | null) {
  const url = new URL(globalThis.location.href)

  if (slug) {
    url.pathname = new URL(withBasePath('/schedule/'), globalThis.location.origin).pathname
    url.searchParams.set(eventSlugSearchParam, slug)
  } else {
    url.searchParams.delete(eventSlugSearchParam)
  }

  globalThis.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
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
  const url = new URL(globalThis.location.href)
  url.pathname = new URL(withBasePath('/gallery/'), globalThis.location.origin).pathname
  url.search = ''

  if (albumSlug) {
    url.searchParams.set(galleryAlbumSearchParam, albumSlug)
  }

  if (albumSlug && photoId) {
    url.searchParams.set(galleryPhotoSearchParam, photoId)
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`

  if (replace) {
    globalThis.history.replaceState({}, '', nextUrl)
    return
  }

  globalThis.history.pushState({}, '', nextUrl)
}

function escapeDriveQueryString(value: string) {
  const backslash = String.fromCodePoint(92)
  const escapedBackslash = String.raw`\\`
  const escapedApostrophe = String.raw`\'`

  return value.replaceAll(backslash, escapedBackslash).replaceAll("'", escapedApostrophe)
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

async function fetchGoogleDriveFile(apiKey: string, fileId: string, fields: string) {
  const url = new URL(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
  )
  url.searchParams.set('key', apiKey)
  url.searchParams.set('fields', fields)

  const response = await fetch(url.href)
  const data = (await response.json()) as GoogleDriveFileResponse

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? 'Google Drive file request failed')
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

async function fetchGoogleDriveThumbnailUrl(apiKey: string, fileId: string, width: number) {
  const file = await fetchGoogleDriveFile(apiKey, fileId, 'id,thumbnailLink')

  return resizeGoogleThumbnail(file.thumbnailLink, width)
}

function getGalleryPhotoFromDriveFile(file: GoogleDriveFile): GalleryPhoto | null {
  if (!file.id || !file.name) {
    return null
  }

  const thumbnailUrl = resizeGoogleThumbnail(file.thumbnailLink, 720)
  const largeUrl = resizeGoogleThumbnail(file.thumbnailLink, 1800)
  const parsedFileName = parseGalleryPhotoFileName(file.name)

  if (!thumbnailUrl || !largeUrl) {
    return null
  }

  return {
    id: file.id,
    name: file.name,
    title: parsedFileName.title,
    date: parsedFileName.date,
    thumbnailUrl,
    largeUrl,
    width: file.imageMediaMetadata?.width,
    height: file.imageMediaMetadata?.height,
  }
}

function compareGalleryPhotosByTimeline(leftPhoto: GalleryPhoto, rightPhoto: GalleryPhoto) {
  const leftTime = leftPhoto.date?.getTime()
  const rightTime = rightPhoto.date?.getTime()

  if (typeof leftTime === 'number' && typeof rightTime === 'number' && leftTime !== rightTime) {
    return rightTime - leftTime
  }

  if (typeof leftTime === 'number' && typeof rightTime !== 'number') {
    return -1
  }

  if (typeof leftTime !== 'number' && typeof rightTime === 'number') {
    return 1
  }

  return leftPhoto.name.localeCompare(rightPhoto.name, 'pl-PL', { numeric: true })
}

function sortGalleryPhotosForAlbum(album: GalleryAlbum, photos: GalleryPhoto[]) {
  if (album.kind !== 'achievements') {
    return photos
  }

  return [...photos].sort(compareGalleryPhotosByTimeline)
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

      const kind: GalleryAlbumKind =
        folder.id === galleryAchievementsFolderId ? 'achievements' : 'standard'
      const parsedFolderName = parseGalleryAlbumFolderName(folder.name)
      const slug = kind === 'achievements' ? galleryAchievementsAlbumSlug : createSlug(folder.name)

      if (!slug) {
        return null
      }

      return {
        id: folder.id,
        kind,
        folderName: folder.name,
        slug,
        title:
          kind === 'achievements'
            ? galleryText.achievementsAlbumTitle
            : parsedFolderName.title,
        date: kind === 'achievements' ? undefined : parsedFolderName.date,
        coverPhoto:
          kind === 'achievements'
            ? undefined
            : await fetchGoogleDriveAlbumCover(config, folder.id),
      }
    }),
  )

  return albums
    .filter((album): album is GalleryAlbum => Boolean(album))
    .sort((leftAlbum, rightAlbum) => {
      if (leftAlbum.kind !== rightAlbum.kind) {
        return leftAlbum.kind === 'achievements' ? -1 : 1
      }

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

  const photos = files
    .map(getGalleryPhotoFromDriveFile)
    .filter((photo): photo is GalleryPhoto => Boolean(photo))

  return sortGalleryPhotosForAlbum(album, photos)
}

function getGalleryPhotoAspectStyle(photo: GalleryPhoto): CSSProperties | undefined {
  if (!photo.width || !photo.height) {
    return undefined
  }

  return {
    aspectRatio: `${photo.width} / ${photo.height}`,
  }
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

  return collapseExcessBlankLines(
    normalizeLineBreaks(
      (parsedDocument.body.textContent ?? trimmedValue).replaceAll('\u00a0', ' '),
    ),
  ).trim()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeCalendarUrl(value?: string | null) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return undefined
  }

  try {
    const url = new URL(trimmedValue, globalThis.location.origin)

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
  const text = value.replaceAll('\u00a0', ' ').trim()

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
  const lines = normalizeLineBreaks(value.replaceAll('\u00a0', ' ')).split('\n')
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
  return collapseExcessBlankLines(
    normalizeLineBreaks(value.replaceAll('\u00a0', ' ')),
  ).trim()
}

function tokenizeCalendarText(value: string): CalendarRichInlineToken[] {
  const lines = normalizeLineBreaks(value).split('\n')
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
  return collapseExcessBlankLines(
    blocks.map(getCalendarBlockText).filter(Boolean).join('\n'),
  ).trim()
}

function getCalendarMetadataValue(text: string, labels: string[]) {
  const trimmedText = text.trim()
  const separatorIndex = trimmedText.indexOf(':')

  if (separatorIndex === -1) {
    return undefined
  }

  const label = trimmedText.slice(0, separatorIndex).trim().toLocaleLowerCase('en-US')

  if (!labels.includes(label)) {
    return undefined
  }

  const value = trimmedText.slice(separatorIndex + 1).trim()

  return value || undefined
}

function getCalendarSlugMetadataValue(text: string) {
  return getCalendarMetadataValue(text, ['slug', 'event-slug'])
}

function getCalendarLanguageMetadata(text: string) {
  const trimmedText = text.trimStart()
  const separatorIndex = trimmedText.indexOf(':')

  if (separatorIndex === -1) {
    return null
  }

  const language = trimmedText.slice(0, separatorIndex).trim().toLocaleLowerCase('en-US')

  if (language !== 'pl' && language !== 'en') {
    return null
  }

  return {
    language: language as Language,
    value: trimmedText.slice(separatorIndex + 1),
  }
}

function extractCalendarNoteMetadata(blocks: CalendarRichBlock[]): CalendarDescriptionMetadata {
  let slug: string | undefined
  const visibleBlocks = blocks
    .map((block): CalendarRichBlock | null => {
      if (block.kind === 'paragraph') {
        const slugValue = getCalendarSlugMetadataValue(block.text)

        if (slugValue) {
          slug = slug ?? createSlug(slugValue)
          return null
        }

        return block
      }

      if (block.kind === 'spacer') {
        return block
      }

      const items = block.items.filter((item) => {
        const slugValue = getCalendarSlugMetadataValue(item.text)

        if (!slugValue) {
          return true
        }

        slug = slug ?? createSlug(slugValue)
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
  languageBlockValue: string,
): CalendarRichParagraphBlock | null {
  if (block.kind !== 'paragraph') {
    return null
  }

  return createPlainTextParagraphBlock(languageBlockValue)
}

function getLocalizedCalendarBlocks(blocks: CalendarRichBlock[], language: Language) {
  const localizedBlocks: Partial<Record<Language, CalendarRichBlock[]>> = {}
  let activeLanguage: Language | null = null
  let hasLocalizedBlock = false

  blocks.forEach((block) => {
    const languageBlock =
      block.kind === 'paragraph'
        ? getCalendarLanguageMetadata(block.text)
        : null

    if (languageBlock) {
      hasLocalizedBlock = true
      activeLanguage = languageBlock.language
      localizedBlocks[activeLanguage] = localizedBlocks[activeLanguage] ?? []

      const strippedBlock = stripLanguageLabelFromBlock(block, languageBlock.value)

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

function getCalendarEventHighlight(title: string): EventHighlight | undefined {
  if (includesEventKeyword(title, ['urodziny', 'birthday'])) {
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
    return collapseWhitespaceRuns(title.replace('!', '')).trim() || title
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
    ? undefined
    : getCalendarEventHighlight(displayTitle)
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
  const fallbackEventId = `${start.date.toISOString()}-${index}`
  const googleEventId = event.id ?? event.iCalUID ?? fallbackEventId

  return {
    id: `${calendarId}-${googleEventId}`,
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

export {
  childrenMassCard,
  copyTextToClipboard,
  emptyGalleryPhotos,
  fetchConfiguredCalendarEvents,
  fetchGoogleDriveAlbumPhotos,
  fetchGoogleDriveGalleryAlbums,
  fetchGoogleDriveThumbnailUrl,
  formatEventDate,
  formatEventRelativeTime,
  formatEventTime,
  formatGalleryAlbumDate,
  formatGalleryPhotoCount,
  formatGalleryTimelinePhotoDate,
  formatGalleryPhotoPosition,
  formatLocalizedHtml,
  getAbsoluteScheduleEventHref,
  getEventCardStyle,
  getEventDomId,
  getEventRelativeProgressWindowDays,
  getEventRelativeTime,
  getEventSlugFromLocation,
  getGalleryAlbumHref,
  getGalleryAlbumSlugFromLocation,
  getGalleryPhotoAlt,
  getGalleryPhotoAspectStyle,
  getGalleryPhotoDisplayTitle,
  getGalleryPhotoHref,
  getGalleryPhotoIdFromLocation,
  getGoogleCalendarConfig,
  getGoogleDriveGalleryConfig,
  getGoogleFrequencyConfig,
  getHomeEventHref,
  getInitialLanguage,
  getInitialTheme,
  getLogoForTheme,
  getPageDocumentTitle,
  getPageFromPath,
  galleryImageLogoSpinnerMinimumMs,
  galleryImageRetryDelays,
  groupEventsByMonth,
  homeScheduleCards,
  isExpandableScheduleEvent,
  languageStorageKey,
  replaceScheduleEventUrl,
  splitCalendarEvents,
  translate,
  translateOptional,
  themeStorageKey,
  updateGalleryUrl,
  withBasePath,
}

export type {
  CalendarEventAttachment,
  CalendarLoadStatus,
  CalendarRichBlock,
  CalendarState,
  GalleryAlbum,
  GalleryAlbumKind,
  GalleryLoadStatus,
  GalleryPhoto,
  GalleryPhotosState,
  GalleryState,
  GoogleCalendarConfig,
  GoogleDriveGalleryConfig,
  GoogleFrequencyConfig,
  EventRelativeTime,
  UpcomingEvent,
}
