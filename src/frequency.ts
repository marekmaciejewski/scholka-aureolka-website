import type { GoogleFrequencyConfig } from './core'
import type { Language } from './siteContent'

type GoogleSheetsErrorResponse = {
  error?: {
    message?: string
  }
}

type GoogleSheetsMetadataResponse = GoogleSheetsErrorResponse & {
  sheets?: Array<{
    properties?: {
      index?: number
      title?: string
    }
  }>
}

type GoogleSheetsValueRange = {
  range?: string
  values?: string[][]
}

type GoogleSheetsValuesResponse = GoogleSheetsErrorResponse & {
  valueRanges?: GoogleSheetsValueRange[]
}

type FrequencyEventType = 'rehearsal' | 'mass' | 'other'
type FrequencyEventTypeFilter = FrequencyEventType | 'all'
type FrequencyPeriodPreset = 'school-year' | 'calendar-year' | 'current-month' | 'all' | 'custom'

type FrequencyMember = {
  age: number
  birthDate: Date
  id: number
  joinDate: Date
  lastPresenceDate: Date | null
}

type FrequencyEvent = {
  date: Date
  id: string
  presentMemberIds: number[]
  sequenceOnDate: number
  sheetTitle: string
  type: FrequencyEventType
}

type FrequencyDataset = {
  events: FrequencyEvent[]
  ignoredMemberIds: number[]
  members: FrequencyMember[]
  warnings: string[]
}

type FrequencyFilters = {
  activeWindowMonths: number
  eventType: FrequencyEventTypeFilter
  maxAge: number
  minAge: number
  periodEnd: Date
  periodPreset: FrequencyPeriodPreset
  periodStart: Date
}

type FrequencyMetric = {
  label: string
  value: number
}

type FrequencyBucket = FrequencyMetric & {
  max: number
}

type FrequencyEventPoint = {
  count: number
  date: Date
  id: string
  label: string
  type: FrequencyEventType
}

type FrequencyMonthlyRow = {
  attendanceRate: number | null
  averagePresent: number
  eventCount: number
  key: string
  label: string
}

type FrequencyPeriodRangeOption = {
  end: Date
  key: string
  label: string
  start: Date
}

type FrequencyViewModel = {
  activeMemberCount: number
  attendanceByAge: FrequencyMetric[]
  attendanceOverTime: FrequencyEventPoint[]
  averageAttendance: number
  averageFrequency: number | null
  filteredMemberCount: number
  frequencyBuckets: FrequencyBucket[]
  medianFrequency: number | null
  monthlyRows: FrequencyMonthlyRow[]
  totalEventCount: number
}

type FrequencyMemberAnalysis = {
  endDate: Date
  isActive: boolean
  member: FrequencyMember
}

const metadataSheetTitle = 'Dane'
const yearSheetTitlePattern = /^20\d{2}$/
const defaultActiveWindowMonths = 2
const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/

const frequencyBucketDefinitions = [
  { label: '0-25%', max: 0.25 },
  { label: '25-50%', max: 0.5 },
  { label: '50-75%', max: 0.75 },
  { label: '75-100%', max: 1 },
]

const eventTypeLabels: Record<FrequencyEventType, Record<Language, string>> = {
  rehearsal: { pl: 'Próby', en: 'Rehearsals' },
  mass: { pl: 'Msze', en: 'Masses' },
  other: { pl: 'Inne', en: 'Other' },
}

const languageLocale: Record<Language, string> = {
  pl: 'pl-PL',
  en: 'en-US',
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getLocalDayValue(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function compareLocalDays(first: Date, second: Date) {
  return getLocalDayValue(first) - getLocalDayValue(second)
}

function minDate(first: Date, second: Date) {
  return compareLocalDays(first, second) <= 0 ? first : second
}

function maxDate(first: Date, second: Date) {
  return compareLocalDays(first, second) >= 0 ? first : second
}

function addCalendarMonths(date: Date, months: number) {
  const normalizedDate = startOfLocalDay(date)
  const day = normalizedDate.getDate()
  const result = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth() + months, 1)
  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate()

  result.setDate(Math.min(day, lastDayOfTargetMonth))

  return startOfLocalDay(result)
}

function parseSheetDate(value: string) {
  const trimmedValue = value.trim()
  const dottedMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmedValue)
  const inputMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue)

  if (dottedMatch) {
    return new Date(Number(dottedMatch[3]), Number(dottedMatch[2]) - 1, Number(dottedMatch[1]))
  }

  if (inputMatch) {
    return new Date(Number(inputMatch[1]), Number(inputMatch[2]) - 1, Number(inputMatch[3]))
  }

  return null
}

function toDateInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDateInputValue(value: string, fallback: Date) {
  if (!dateInputPattern.test(value)) {
    return fallback
  }

  return parseSheetDate(value) ?? fallback
}

function getSheetTitleFromRange(range?: string) {
  const sheetName = range?.split('!')[0] ?? ''

  return sheetName.startsWith("'") && sheetName.endsWith("'")
    ? sheetName.slice(1, -1).replaceAll("''", "'")
    : sheetName
}

function getFrequencySheetUrl(config: GoogleFrequencyConfig, path = '') {
  return new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      config.spreadsheetId,
    )}${path}`,
  )
}

async function fetchFrequencySheetTitles(config: GoogleFrequencyConfig) {
  const url = getFrequencySheetUrl(config)
  url.searchParams.set('includeGridData', 'false')
  url.searchParams.set('fields', 'sheets(properties(index,title))')
  url.searchParams.set('key', config.apiKey)

  const response = await fetch(url)
  const data = (await response.json()) as GoogleSheetsMetadataResponse

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? 'Google Sheets metadata request failed')
  }

  return (data.sheets ?? [])
    .map((sheet) => ({
      index: sheet.properties?.index ?? 0,
      title: sheet.properties?.title ?? '',
    }))
    .filter((sheet) => sheet.title)
    .sort((first, second) => first.index - second.index)
}

async function fetchFrequencySheetValues(config: GoogleFrequencyConfig, ranges: string[]) {
  const url = getFrequencySheetUrl(config, '/values:batchGet')
  ranges.forEach((range) => url.searchParams.append('ranges', range))
  url.searchParams.set('majorDimension', 'ROWS')
  url.searchParams.set('valueRenderOption', 'FORMATTED_VALUE')
  url.searchParams.set('dateTimeRenderOption', 'FORMATTED_STRING')
  url.searchParams.set('key', config.apiKey)

  const response = await fetch(url)
  const data = (await response.json()) as GoogleSheetsValuesResponse

  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? 'Google Sheets values request failed')
  }

  return data.valueRanges ?? []
}

function getFrequencyEventType(date: Date, sequenceOnDate: number): FrequencyEventType {
  if (sequenceOnDate > 1) {
    return 'other'
  }

  if (date.getDay() === 4) {
    return 'rehearsal'
  }

  if (date.getDay() === 0) {
    return 'mass'
  }

  return 'other'
}

function getAge(birthDate: Date, referenceDate: Date) {
  const normalizedReferenceDate = startOfLocalDay(referenceDate)
  const age = normalizedReferenceDate.getFullYear() - birthDate.getFullYear()
  const hasHadBirthday =
    normalizedReferenceDate.getMonth() > birthDate.getMonth() ||
    (normalizedReferenceDate.getMonth() === birthDate.getMonth() &&
      normalizedReferenceDate.getDate() >= birthDate.getDate())

  return hasHadBirthday ? age : age - 1
}

function getMemberStatus(
  member: FrequencyMember,
  activeWindowMonths: number,
  referenceDate: Date,
) {
  if (!member.lastPresenceDate) {
    return 'inactive' as const
  }

  const activeSince = addCalendarMonths(referenceDate, -Math.max(1, activeWindowMonths))

  return compareLocalDays(member.lastPresenceDate, activeSince) >= 0 ? 'active' : 'inactive'
}

function parseFrequencyMembers(rows: string[][], referenceDate: Date) {
  const warnings: string[] = []
  const ignoredMemberIds: number[] = []
  const members = new Map<number, Omit<FrequencyMember, 'lastPresenceDate'>>()

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2
    const memberId = Number(row[0]?.trim())
    const joinDate = row[1] ? parseSheetDate(row[1]) : null
    const birthDate = row[2] ? parseSheetDate(row[2]) : null

    if (!Number.isInteger(memberId) || !joinDate) {
      warnings.push(`Ignored member metadata row ${rowNumber}.`)
      return
    }

    if (!birthDate) {
      ignoredMemberIds.push(memberId)
      return
    }

    members.set(memberId, {
      age: getAge(birthDate, referenceDate),
      birthDate,
      id: memberId,
      joinDate,
    })
  })

  return { ignoredMemberIds, members, warnings }
}

function parseFrequencyEvents(
  sheetTitle: string,
  rows: string[][],
  members: Map<number, Omit<FrequencyMember, 'lastPresenceDate'>>,
) {
  const warnings: string[] = []
  const headers = rows[0] ?? []
  const memberRows = new Map<number, string[]>()
  const dateSequenceCounts = new Map<string, number>()

  rows.slice(1).forEach((row) => {
    const memberId = Number(row[0]?.trim())

    if (Number.isInteger(memberId)) {
      memberRows.set(memberId, row)
    }
  })

  const events = headers
    .slice(1)
    .map((headerValue, headerIndex): FrequencyEvent | null => {
      const columnIndex = headerIndex + 1
      const date = parseSheetDate(headerValue)

      if (!date) {
        warnings.push(`Ignored event column ${columnIndex + 1} in ${sheetTitle}.`)
        return null
      }

      const dateKey = toDateInputValue(date)
      const sequenceOnDate = (dateSequenceCounts.get(dateKey) ?? 0) + 1
      const presentMemberIds: number[] = []

      dateSequenceCounts.set(dateKey, sequenceOnDate)

      members.forEach((member) => {
        const row = memberRows.get(member.id)
        const marker = row?.[columnIndex]?.trim() ?? ''

        if (marker === '1') {
          presentMemberIds.push(member.id)
        } else if (marker) {
          warnings.push(`Ignored marker "${marker}" for ${member.id} on ${dateKey}.`)
        }
      })

      return {
        date,
        id: `${sheetTitle}-${columnIndex}-${dateKey}`,
        presentMemberIds,
        sequenceOnDate,
        sheetTitle,
        type: getFrequencyEventType(date, sequenceOnDate),
      }
    })
    .filter((event): event is FrequencyEvent => event !== null)
    .map((event) => {
      event.presentMemberIds.sort((first, second) => first - second)
      return event
    })

  return { events, warnings }
}

function parseFrequencySheetValues(
  valueRanges: GoogleSheetsValueRange[],
  referenceDate = new Date(),
): FrequencyDataset {
  const sheets = new Map(
    valueRanges.map((valueRange) => [getSheetTitleFromRange(valueRange.range), valueRange.values ?? []]),
  )
  const metadataRows = sheets.get(metadataSheetTitle)

  if (!metadataRows) {
    throw new Error('Attendance metadata sheet is missing')
  }

  const parsedMembers = parseFrequencyMembers(metadataRows, referenceDate)
  const warnings = [...parsedMembers.warnings]
  const eventSheets = Array.from(sheets.entries())
    .filter(([sheetTitle]) => yearSheetTitlePattern.test(sheetTitle))
    .sort(([firstTitle], [secondTitle]) => firstTitle.localeCompare(secondTitle))
  const events = eventSheets.flatMap(([sheetTitle, rows]) => {
    const parsedEvents = parseFrequencyEvents(sheetTitle, rows, parsedMembers.members)
    warnings.push(...parsedEvents.warnings)
    return parsedEvents.events
  })
  const lastPresenceByMemberId = new Map<number, Date>()

  events.forEach((event) => {
    event.presentMemberIds.forEach((memberId) => {
      const currentLastPresence = lastPresenceByMemberId.get(memberId)

      if (!currentLastPresence || compareLocalDays(event.date, currentLastPresence) > 0) {
        lastPresenceByMemberId.set(memberId, event.date)
      }
    })
  })

  return {
    events: events.sort((first, second) => {
      const dateComparison = compareLocalDays(first.date, second.date)

      return dateComparison === 0 ? first.sequenceOnDate - second.sequenceOnDate : dateComparison
    }),
    ignoredMemberIds: parsedMembers.ignoredMemberIds.sort((first, second) => first - second),
    members: Array.from(parsedMembers.members.values())
      .map((member) => ({
        ...member,
        lastPresenceDate: lastPresenceByMemberId.get(member.id) ?? null,
      }))
      .sort((first, second) => first.id - second.id),
    warnings,
  }
}

async function fetchGoogleFrequencyDataset(
  config: GoogleFrequencyConfig,
  referenceDate = new Date(),
) {
  const sheetTitles = await fetchFrequencySheetTitles(config)
  const ranges = sheetTitles
    .map((sheet) => sheet.title)
    .filter((sheetTitle) => sheetTitle === metadataSheetTitle || yearSheetTitlePattern.test(sheetTitle))

  if (!ranges.includes(metadataSheetTitle)) {
    throw new Error('Attendance metadata sheet is missing')
  }

  const valueRanges = await fetchFrequencySheetValues(config, ranges)

  return parseFrequencySheetValues(valueRanges, referenceDate)
}

function getDatasetDateRange(dataset: FrequencyDataset) {
  const dates = dataset.events.map((event) => event.date)

  if (dates.length === 0) {
    const today = startOfLocalDay(new Date())
    return { end: today, start: today }
  }

  return {
    end: dates[dates.length - 1],
    start: dates[0],
  }
}

function getPeriodForPreset(
  preset: FrequencyPeriodPreset,
  dataset: FrequencyDataset,
  referenceDate = new Date(),
) {
  const normalizedReferenceDate = startOfLocalDay(referenceDate)
  const dataRange = getDatasetDateRange(dataset)

  if (preset === 'all') {
    return dataRange
  }

  if (preset === 'current-month') {
    return {
      end: new Date(
        normalizedReferenceDate.getFullYear(),
        normalizedReferenceDate.getMonth() + 1,
        0,
      ),
      start: new Date(normalizedReferenceDate.getFullYear(), normalizedReferenceDate.getMonth(), 1),
    }
  }

  if (preset === 'calendar-year') {
    return {
      end: new Date(normalizedReferenceDate.getFullYear(), 11, 31),
      start: new Date(normalizedReferenceDate.getFullYear(), 0, 1),
    }
  }

  const schoolYearStart =
    normalizedReferenceDate.getMonth() >= 8
      ? normalizedReferenceDate.getFullYear()
      : normalizedReferenceDate.getFullYear() - 1

  return {
    end: new Date(schoolYearStart + 1, 5, 30),
    start: new Date(schoolYearStart, 8, 1),
  }
}

function getCalendarYearOption(year: number): FrequencyPeriodRangeOption {
  return {
    end: new Date(year, 11, 31),
    key: String(year),
    label: String(year),
    start: new Date(year, 0, 1),
  }
}

function getSchoolYearStartYear(date: Date) {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1
}

function getSchoolYearOption(startYear: number): FrequencyPeriodRangeOption {
  return {
    end: new Date(startYear + 1, 5, 30),
    key: String(startYear),
    label: `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`,
    start: new Date(startYear, 8, 1),
  }
}

function getCalendarYearKey(date: Date) {
  return String(date.getFullYear())
}

function getSchoolYearKey(date: Date) {
  return String(getSchoolYearStartYear(date))
}

function getAvailableCalendarYearOptions(dataset: FrequencyDataset) {
  return Array.from(new Set(dataset.events.map((event) => event.date.getFullYear())))
    .sort((first, second) => first - second)
    .map(getCalendarYearOption)
}

function getAvailableSchoolYearOptions(dataset: FrequencyDataset) {
  return Array.from(new Set(dataset.events.map((event) => getSchoolYearStartYear(event.date))))
    .sort((first, second) => first - second)
    .map(getSchoolYearOption)
}

function getFrequencyDefaultFilters(
  dataset: FrequencyDataset,
  referenceDate = new Date(),
): FrequencyFilters {
  const period = getPeriodForPreset('school-year', dataset, referenceDate)
  const ages = dataset.members.map((member) => member.age)
  const minAge = ages.length > 0 ? Math.min(...ages) : 0
  const maxAge = ages.length > 0 ? Math.max(...ages) : 0

  return {
    activeWindowMonths: defaultActiveWindowMonths,
    eventType: 'all',
    maxAge,
    minAge,
    periodEnd: period.end,
    periodPreset: 'school-year',
    periodStart: period.start,
  }
}

function isDateWithinRange(date: Date, start: Date, end: Date) {
  return compareLocalDays(date, start) >= 0 && compareLocalDays(date, end) <= 0
}

function getAgeFilteredMembers(dataset: FrequencyDataset, filters: FrequencyFilters) {
  return dataset.members.filter((member) => {
    return member.age >= filters.minAge && member.age <= filters.maxAge
  })
}

function getPeriodEvents(dataset: FrequencyDataset, filters: FrequencyFilters, referenceDate: Date) {
  const periodEnd = minDate(filters.periodEnd, referenceDate)

  return dataset.events.filter((event) => {
    return isDateWithinRange(event.date, filters.periodStart, periodEnd)
  })
}

function getFilteredEvents(dataset: FrequencyDataset, filters: FrequencyFilters, referenceDate: Date) {
  return getPeriodEvents(dataset, filters, referenceDate).filter((event) => {
    return filters.eventType === 'all' || event.type === filters.eventType
  })
}

function getMedian(values: number[]) {
  if (values.length === 0) {
    return null
  }

  const sortedValues = [...values].sort((first, second) => first - second)
  const middleIndex = Math.floor(sortedValues.length / 2)

  return sortedValues.length % 2 === 0
    ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
    : sortedValues[middleIndex]
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return null
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function formatFrequencyEventLabel(event: FrequencyEvent, language: Language) {
  return new Intl.DateTimeFormat(languageLocale[language], {
    day: 'numeric',
    month: 'short',
  }).format(event.date)
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(date: Date, language: Language) {
  return new Intl.DateTimeFormat(languageLocale[language], {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getLastPresenceDatesAtReferenceDate(dataset: FrequencyDataset, referenceDate: Date) {
  const lastPresenceByMemberId = new Map<number, Date>()

  dataset.events.forEach((event) => {
    if (compareLocalDays(event.date, referenceDate) > 0) {
      return
    }

    event.presentMemberIds.forEach((memberId) => {
      const currentLastPresence = lastPresenceByMemberId.get(memberId)

      if (!currentLastPresence || compareLocalDays(event.date, currentLastPresence) > 0) {
        lastPresenceByMemberId.set(memberId, event.date)
      }
    })
  })

  return lastPresenceByMemberId
}

function getLastEventDate(events: FrequencyEvent[], fallbackDate: Date) {
  return events.at(-1)?.date ?? fallbackDate
}

function getGlobalActivityReferenceDate(dataset: FrequencyDataset, referenceDate: Date) {
  const pastEvents = dataset.events.filter((event) => compareLocalDays(event.date, referenceDate) <= 0)

  return getLastEventDate(pastEvents, referenceDate)
}

function createMemberAnalyses(
  members: FrequencyMember[],
  filters: FrequencyFilters,
  activityReferenceDate: Date,
  calculationEndDate: Date,
  lastPresenceByMemberId: Map<number, Date>,
) {
  const activeSince = addCalendarMonths(activityReferenceDate, -Math.max(1, filters.activeWindowMonths))

  return members.map((member): FrequencyMemberAnalysis => {
    const lastPresenceDate = lastPresenceByMemberId.get(member.id)
    const isActive = lastPresenceDate
      ? compareLocalDays(lastPresenceDate, activeSince) >= 0
      : false

    return {
      endDate: isActive || !lastPresenceDate ? calculationEndDate : minDate(calculationEndDate, lastPresenceDate),
      isActive,
      member,
    }
  })
}

function isMemberEligibleForEvent(analysis: FrequencyMemberAnalysis, event: FrequencyEvent) {
  return (
    compareLocalDays(analysis.member.joinDate, event.date) <= 0 &&
    compareLocalDays(event.date, analysis.endDate) <= 0
  )
}

function createFrequencyViewModel(
  dataset: FrequencyDataset,
  filters: FrequencyFilters,
  language: Language,
  referenceDate = new Date(),
): FrequencyViewModel {
  const periodEvents = getPeriodEvents(dataset, filters, referenceDate)
  const calculationEndDate = getLastEventDate(periodEvents, minDate(filters.periodEnd, referenceDate))
  const activityReferenceDate = getGlobalActivityReferenceDate(dataset, referenceDate)
  const lastPresenceByMemberId = getLastPresenceDatesAtReferenceDate(dataset, activityReferenceDate)
  const filteredMembers = getAgeFilteredMembers(dataset, filters)
  const memberAnalyses = createMemberAnalyses(
    filteredMembers,
    filters,
    activityReferenceDate,
    calculationEndDate,
    lastPresenceByMemberId,
  )
  const filteredMemberIds = new Set(filteredMembers.map((member) => member.id))
  const filteredEvents = getFilteredEvents(dataset, filters, referenceDate)
  const activeMemberCount = memberAnalyses.filter((analysis) => analysis.isActive).length
  const eventPoints = filteredEvents.map((event) => ({
    count: event.presentMemberIds.filter((memberId) => filteredMemberIds.has(memberId)).length,
    date: event.date,
    id: event.id,
    label: formatFrequencyEventLabel(event, language),
    type: event.type,
  }))
  const totalPresenceCount = eventPoints.reduce((total, point) => total + point.count, 0)
  const frequencies = memberAnalyses
    .map((analysis) => {
      const memberStartDate = maxDate(analysis.member.joinDate, filters.periodStart)
      const eligibleEvents = filteredEvents.filter((event) =>
        isDateWithinRange(event.date, memberStartDate, analysis.endDate),
      )

      if (eligibleEvents.length === 0) {
        return null
      }

      const attendedEventCount = eligibleEvents.filter((event) =>
        event.presentMemberIds.includes(analysis.member.id),
      ).length

      return attendedEventCount / eligibleEvents.length
    })
    .filter((frequency): frequency is number => frequency !== null)
  const frequencyBuckets = frequencyBucketDefinitions.map((bucket, index) => {
    const min = index === 0 ? 0 : frequencyBucketDefinitions[index - 1].max
    const isLastBucket = bucket.max === 1
    const value = frequencies.filter((frequency) =>
      isLastBucket
        ? frequency >= min && frequency <= bucket.max
        : frequency >= min && frequency < bucket.max,
    ).length

    return {
      ...bucket,
      value,
    }
  })
  const attendanceByAge = Array.from(new Set(filteredMembers.map((member) => member.age)))
    .sort((first, second) => first - second)
    .map((age) => {
      const analysesAtAge = memberAnalyses.filter((analysis) => analysis.member.age === age)
      const memberIdsAtAge = new Set(analysesAtAge.map((analysis) => analysis.member.id))
      const eligibleSlots = filteredEvents.reduce(
        (total, event) =>
          total +
          analysesAtAge.filter((analysis) => isMemberEligibleForEvent(analysis, event)).length,
        0,
      )
      const presentMarks = filteredEvents.reduce(
        (total, event) => {
          const eligibleMemberIdsAtAge = new Set(
            analysesAtAge
              .filter((analysis) => isMemberEligibleForEvent(analysis, event))
              .map((analysis) => analysis.member.id),
          )

          return (
            total +
            event.presentMemberIds.filter(
              (memberId) => memberIdsAtAge.has(memberId) && eligibleMemberIdsAtAge.has(memberId),
            ).length
          )
        },
        0,
      )

      return {
        label: language === 'pl' ? `${age} lat` : `${age} yo`,
        value: eligibleSlots === 0 ? 0 : presentMarks / eligibleSlots,
      }
    })
  const monthlyMap = filteredEvents.reduce((months, event) => {
    const key = getMonthKey(event.date)
    const row = months.get(key) ?? {
      date: new Date(event.date.getFullYear(), event.date.getMonth(), 1),
      eligibleSlots: 0,
      eventCount: 0,
      presentMarks: 0,
    }
    const eligibleMemberIds = new Set(
      memberAnalyses
        .filter((analysis) => isMemberEligibleForEvent(analysis, event))
        .map((analysis) => analysis.member.id),
    )

    row.eventCount += 1
    row.eligibleSlots += eligibleMemberIds.size
    row.presentMarks += event.presentMemberIds.filter((memberId) => eligibleMemberIds.has(memberId)).length
    months.set(key, row)

    return months
  }, new Map<string, { date: Date; eligibleSlots: number; eventCount: number; presentMarks: number }>())

  return {
    activeMemberCount,
    attendanceByAge,
    attendanceOverTime: eventPoints,
    averageAttendance: filteredEvents.length === 0 ? 0 : totalPresenceCount / filteredEvents.length,
    averageFrequency: getAverage(frequencies),
    filteredMemberCount: filteredMembers.length,
    frequencyBuckets,
    medianFrequency: getMedian(frequencies),
    monthlyRows: Array.from(monthlyMap.entries())
      .map(([key, row]) => ({
        attendanceRate: row.eligibleSlots === 0 ? null : row.presentMarks / row.eligibleSlots,
        averagePresent: row.eventCount === 0 ? 0 : row.presentMarks / row.eventCount,
        eventCount: row.eventCount,
        key,
        label: getMonthLabel(row.date, language),
      }))
      .sort((first, second) => first.key.localeCompare(second.key)),
    totalEventCount: filteredEvents.length,
  }
}

export {
  addCalendarMonths,
  createFrequencyViewModel,
  defaultActiveWindowMonths,
  eventTypeLabels,
  fetchGoogleFrequencyDataset,
  getAvailableCalendarYearOptions,
  getAvailableSchoolYearOptions,
  getCalendarYearKey,
  getFrequencyDefaultFilters,
  getMemberStatus,
  getPeriodForPreset,
  getSchoolYearKey,
  parseDateInputValue,
  parseFrequencySheetValues,
  toDateInputValue,
}

export type {
  FrequencyDataset,
  FrequencyEvent,
  FrequencyEventPoint,
  FrequencyEventType,
  FrequencyEventTypeFilter,
  FrequencyFilters,
  FrequencyMember,
  FrequencyMetric,
  FrequencyMonthlyRow,
  FrequencyPeriodRangeOption,
  FrequencyPeriodPreset,
  FrequencyViewModel,
}
