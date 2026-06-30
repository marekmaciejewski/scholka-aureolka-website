import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { PageHeading } from '../components/Layout'
import { frequencyText, type Language, type LocalizedText } from '../siteContent'
import { getGoogleFrequencyConfig, translate } from '../core'
import {
  createFrequencyViewModel,
  fetchGoogleFrequencyDataset,
  getAvailableCalendarYearOptions,
  getAvailableSchoolYearOptions,
  getCalendarYearKey,
  getFrequencyDefaultFilters,
  getPeriodForPreset,
  getSchoolYearKey,
  parseDateInputValue,
  toDateInputValue,
  type FrequencyDataset,
  type FrequencyEventPoint,
  type FrequencyEventType,
  type FrequencyEventTypeFilter,
  type FrequencyFilters,
  type FrequencyMetric,
  type FrequencyPeriodRangeOption,
  type FrequencyPeriodPreset,
  type FrequencyViewModel,
} from '../frequency'

type FrequencyState =
  | {
      dataset: FrequencyDataset
      status: 'ready'
    }
  | {
      dataset?: undefined
      status: 'error' | 'loading' | 'unconfigured'
    }

type FrequencyPeriodOption = {
  key: FrequencyPeriodPreset
  label: LocalizedText
}

type FrequencyEventTypeOption = {
  key: FrequencyEventTypeFilter
  label: LocalizedText
}

type MetricCard = {
  label: LocalizedText
  value: string
}

type ChartValueStyle = CSSProperties & {
  '--bar-value'?: string
  '--tooltip-x'?: string
  '--tooltip-y'?: string
}

type TimelineHoverPoint = {
  count: number
  id: string
  label: string
  x: number
  y: number
}

type ScrollCueState = {
  atEnd: boolean
  atStart: boolean
}

type AgePresetValue = 'all' | 'custom' | `age-${number}`
type TimelineScale = 'even' | 'proportional'

const periodOptions: FrequencyPeriodOption[] = [
  { key: 'school-year', label: frequencyText.periodSchoolYear },
  { key: 'calendar-year', label: frequencyText.periodCalendarYear },
  { key: 'current-month', label: frequencyText.periodCurrentMonth },
  { key: 'all', label: frequencyText.periodAll },
  { key: 'custom', label: frequencyText.periodCustom },
]

const eventTypeOptions: FrequencyEventTypeOption[] = [
  { key: 'all', label: frequencyText.eventTypeAll },
  { key: 'rehearsal', label: frequencyText.eventTypeRehearsal },
  { key: 'mass', label: frequencyText.eventTypeMass },
  { key: 'other', label: frequencyText.eventTypeOther },
]

function formatNumber(value: number, language: Language, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', {
    maximumFractionDigits,
  }).format(value)
}

function formatPercent(value: number | null, language: Language) {
  if (value === null) {
    return translate(frequencyText.noData, language)
  }

  return new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-US', {
    maximumFractionDigits: 0,
    style: 'percent',
  }).format(value)
}

function getMetricCards(viewModel: FrequencyViewModel, language: Language): MetricCard[] {
  return [
    {
      label: frequencyText.averageAttendance,
      value: formatNumber(viewModel.averageAttendance, language),
    },
    {
      label: frequencyText.activeMembers,
      value: formatNumber(viewModel.activeMemberCount, language, 0),
    },
    {
      label: frequencyText.averageFrequency,
      value: formatPercent(viewModel.averageFrequency, language),
    },
    {
      label: frequencyText.medianFrequency,
      value: formatPercent(viewModel.medianFrequency, language),
    },
  ]
}

function FrequencyStatusMessage({
  children,
  status,
}: Readonly<{
  children: ReactNode
  status: FrequencyState['status'] | 'ready'
}>) {
  return <output className={`frequency-status ${status}`}>{children}</output>
}

function HorizontalScrollFrame({
  children,
  className,
  refreshKey,
}: Readonly<{
  children: ReactNode
  className: string
  refreshKey: number | string
}>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollCueState, setScrollCueState] = useState<ScrollCueState>({
    atEnd: true,
    atStart: true,
  })

  useEffect(() => {
    const element = scrollRef.current

    if (!element) {
      return undefined
    }

    const scrollElement = element

    function updateScrollCueState() {
      const visibleWidth = scrollElement.getBoundingClientRect().width
      const maxScrollLeft = Math.max(0, scrollElement.scrollWidth - visibleWidth)
      const nextScrollCueState = {
        atEnd: maxScrollLeft <= 1 || scrollElement.scrollLeft >= maxScrollLeft - 1,
        atStart: scrollElement.scrollLeft <= 1,
      }

      setScrollCueState((currentScrollCueState) =>
        currentScrollCueState.atEnd === nextScrollCueState.atEnd &&
        currentScrollCueState.atStart === nextScrollCueState.atStart
          ? currentScrollCueState
          : nextScrollCueState,
      )
    }

    updateScrollCueState()
    scrollElement.addEventListener('scroll', updateScrollCueState, { passive: true })
    window.addEventListener('resize', updateScrollCueState)

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollCueState)
    resizeObserver?.observe(scrollElement)

    if (scrollElement.firstElementChild) {
      resizeObserver?.observe(scrollElement.firstElementChild)
    }

    return () => {
      scrollElement.removeEventListener('scroll', updateScrollCueState)
      window.removeEventListener('resize', updateScrollCueState)
      resizeObserver?.disconnect()
    }
  }, [refreshKey])

  return (
    <div
      className="frequency-scroll-frame"
      data-scroll-at-end={String(scrollCueState.atEnd)}
      data-scroll-at-start={String(scrollCueState.atStart)}
    >
      <div className={className} ref={scrollRef}>
        {children}
      </div>
      <span className="frequency-scroll-cue frequency-scroll-cue-left" aria-hidden="true" />
      <span className="frequency-scroll-cue frequency-scroll-cue-right" aria-hidden="true" />
    </div>
  )
}

function FrequencyFiltersPanel({
  dataset,
  filters,
  language,
  onFiltersChange,
  referenceDate,
}: Readonly<{
  dataset: FrequencyDataset
  filters: FrequencyFilters
  language: Language
  onFiltersChange: (filters: FrequencyFilters) => void
  referenceDate: Date
}>) {
  const defaultFilters = useMemo(
    () => getFrequencyDefaultFilters(dataset, referenceDate),
    [dataset, referenceDate],
  )
  const calendarYearOptions = useMemo(() => getAvailableCalendarYearOptions(dataset), [dataset])
  const schoolYearOptions = useMemo(() => getAvailableSchoolYearOptions(dataset), [dataset])
  const ageOptions = useMemo(
    () =>
      Array.from(new Set(dataset.members.map((member) => member.age))).sort(
        (first, second) => first - second,
      ),
    [dataset],
  )
  const selectedAgePreset = getAgePresetValue(filters, defaultFilters)

  function getSelectedPeriodOptionIndex(
    options: FrequencyPeriodRangeOption[],
    date: Date,
    getKey: (date: Date) => string,
    fallbackIndex: number,
  ) {
    const selectedIndex = options.findIndex((option) => option.key === getKey(date))

    return selectedIndex >= 0 ? selectedIndex : fallbackIndex
  }

  function getDefaultOptionPeriod(
    options: FrequencyPeriodRangeOption[],
    fallbackPeriod: { end: Date; start: Date },
    getKey: (date: Date) => string,
  ) {
    if (options.length === 0) {
      return fallbackPeriod
    }

    const fallbackKey = getKey(fallbackPeriod.start)

    return options.find((option) => option.key === fallbackKey) ?? options[options.length - 1]
  }

  function updatePreset(periodPreset: FrequencyPeriodPreset) {
    if (periodPreset === 'custom') {
      onFiltersChange({ ...filters, periodPreset })
      return
    }

    const fallbackPeriod = getPeriodForPreset(periodPreset, dataset, referenceDate)
    const period =
      periodPreset === 'school-year'
        ? getDefaultOptionPeriod(schoolYearOptions, fallbackPeriod, getSchoolYearKey)
        : periodPreset === 'calendar-year'
          ? getDefaultOptionPeriod(calendarYearOptions, fallbackPeriod, getCalendarYearKey)
          : fallbackPeriod

    onFiltersChange({
      ...filters,
      periodEnd: period.end,
      periodPreset,
      periodStart: period.start,
    })
  }

  function updatePeriodOptionRange(
    options: FrequencyPeriodRangeOption[],
    boundary: 'periodEnd' | 'periodStart',
    value: string,
    getKey: (date: Date) => string,
  ) {
    const selectedIndex = options.findIndex((option) => option.key === value)

    if (selectedIndex < 0) {
      return
    }

    let startIndex = getSelectedPeriodOptionIndex(options, filters.periodStart, getKey, selectedIndex)
    const endIndex = selectedIndex
    let nextPeriodPreset = filters.periodPreset

    if (boundary === 'periodStart') {
      startIndex = selectedIndex
    } else {
      if (endIndex < startIndex) {
        startIndex = endIndex
      } else if (endIndex > startIndex) {
        nextPeriodPreset = 'custom'
      }
    }

    onFiltersChange({
      ...filters,
      periodEnd: options[endIndex].end,
      periodPreset: nextPeriodPreset,
      periodStart: options[startIndex].start,
    })
  }

  function updateDateRange(key: 'periodEnd' | 'periodStart', value: string) {
    onFiltersChange({
      ...filters,
      [key]: parseDateInputValue(value, filters[key]),
      periodPreset: 'custom',
    })
  }

  function getAgeInputValue(value: string) {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) {
      return null
    }

    return Math.min(defaultFilters.maxAge, Math.max(defaultFilters.minAge, Math.round(numericValue)))
  }

  function updateAgeBoundary(boundary: 'maxAge' | 'minAge', value: string) {
    const age = getAgeInputValue(value)

    if (age === null) {
      return
    }

    if (boundary === 'minAge') {
      onFiltersChange({
        ...filters,
        maxAge: age,
        minAge: age,
      })
      return
    }

    onFiltersChange({
      ...filters,
      maxAge: age,
      minAge: Math.min(filters.minAge, age),
    })
  }

  function updateActiveWindow(value: string) {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) {
      return
    }

    onFiltersChange({
      ...filters,
      activeWindowMonths: Math.max(1, Math.round(numericValue)),
    })
  }

  function updateAgePreset(value: AgePresetValue) {
    if (value === 'custom') {
      return
    }

    if (value === 'all') {
      onFiltersChange({
        ...filters,
        maxAge: defaultFilters.maxAge,
        minAge: defaultFilters.minAge,
      })
      return
    }

    const age = Number(value.replace('age-', ''))

    if (!Number.isFinite(age)) {
      return
    }

    onFiltersChange({
      ...filters,
      maxAge: age,
      minAge: age,
    })
  }

  function renderPeriodRangeFilters() {
    if (filters.periodPreset === 'school-year') {
      return (
        <>
          <PeriodRangeSelect
            id="frequency-school-year-start"
            label={frequencyText.dateFromLabel}
            language={language}
            options={schoolYearOptions}
            value={getSchoolYearKey(filters.periodStart)}
            onChange={(value) =>
              updatePeriodOptionRange(schoolYearOptions, 'periodStart', value, getSchoolYearKey)
            }
          />
          <PeriodRangeSelect
            id="frequency-school-year-end"
            label={frequencyText.dateToLabel}
            language={language}
            options={schoolYearOptions}
            value={getSchoolYearKey(filters.periodEnd)}
            onChange={(value) =>
              updatePeriodOptionRange(schoolYearOptions, 'periodEnd', value, getSchoolYearKey)
            }
          />
        </>
      )
    }

    if (filters.periodPreset === 'calendar-year') {
      return (
        <>
          <PeriodRangeSelect
            id="frequency-calendar-year-start"
            label={frequencyText.dateFromLabel}
            language={language}
            options={calendarYearOptions}
            value={getCalendarYearKey(filters.periodStart)}
            onChange={(value) =>
              updatePeriodOptionRange(calendarYearOptions, 'periodStart', value, getCalendarYearKey)
            }
          />
          <PeriodRangeSelect
            id="frequency-calendar-year-end"
            label={frequencyText.dateToLabel}
            language={language}
            options={calendarYearOptions}
            value={getCalendarYearKey(filters.periodEnd)}
            onChange={(value) =>
              updatePeriodOptionRange(calendarYearOptions, 'periodEnd', value, getCalendarYearKey)
            }
          />
        </>
      )
    }

    if (filters.periodPreset !== 'custom') {
      return null
    }

    return (
      <>
        <div className="frequency-filter-field frequency-filter-compact">
          <label htmlFor="frequency-date-start">{translate(frequencyText.dateFromLabel, language)}</label>
          <input
            id="frequency-date-start"
            type="date"
            value={toDateInputValue(filters.periodStart)}
            onChange={(event) => updateDateRange('periodStart', event.currentTarget.value)}
          />
        </div>

        <div className="frequency-filter-field frequency-filter-compact">
          <label htmlFor="frequency-date-end">{translate(frequencyText.dateToLabel, language)}</label>
          <input
            id="frequency-date-end"
            type="date"
            value={toDateInputValue(filters.periodEnd)}
            onChange={(event) => updateDateRange('periodEnd', event.currentTarget.value)}
          />
        </div>
      </>
    )
  }

  return (
    <section className="frequency-filters" aria-label={translate(frequencyText.filtersLabel, language)}>
      <div className="frequency-filter-field">
        <label htmlFor="frequency-period">{translate(frequencyText.periodLabel, language)}</label>
        <select
          id="frequency-period"
          value={filters.periodPreset}
          onChange={(event) => updatePreset(event.currentTarget.value as FrequencyPeriodPreset)}
        >
          {periodOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {translate(option.label, language)}
            </option>
          ))}
        </select>
      </div>

      {renderPeriodRangeFilters()}

      <div className="frequency-filter-field">
        <label htmlFor="frequency-event-type">{translate(frequencyText.eventTypeLabel, language)}</label>
        <select
          id="frequency-event-type"
          value={filters.eventType}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              eventType: event.currentTarget.value as FrequencyEventTypeFilter,
            })
          }
        >
          {eventTypeOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {translate(option.label, language)}
            </option>
          ))}
        </select>
      </div>

      <div className="frequency-filter-field">
        <label htmlFor="frequency-age-preset">{translate(frequencyText.agePresetLabel, language)}</label>
        <select
          id="frequency-age-preset"
          value={selectedAgePreset}
          onChange={(event) => updateAgePreset(event.currentTarget.value as AgePresetValue)}
        >
          <option value="all">{translate(frequencyText.agePresetAll, language)}</option>
          {selectedAgePreset === 'custom' && (
            <option value="custom">{translate(frequencyText.agePresetCustom, language)}</option>
          )}
          {ageOptions.map((age) => (
            <option key={age} value={`age-${age}`}>
              {formatAgeOption(age, language)}
            </option>
          ))}
        </select>
      </div>

      <div className="frequency-filter-field frequency-filter-compact">
        <label htmlFor="frequency-age-start">{translate(frequencyText.ageFromLabel, language)}</label>
        <input
          id="frequency-age-start"
          min={defaultFilters.minAge}
          max={defaultFilters.maxAge}
          type="number"
          value={filters.minAge}
          onChange={(event) => updateAgeBoundary('minAge', event.currentTarget.value)}
        />
      </div>

      <div className="frequency-filter-field frequency-filter-compact">
        <label htmlFor="frequency-age-end">{translate(frequencyText.ageToLabel, language)}</label>
        <input
          id="frequency-age-end"
          min={defaultFilters.minAge}
          max={defaultFilters.maxAge}
          type="number"
          value={filters.maxAge}
          onChange={(event) => updateAgeBoundary('maxAge', event.currentTarget.value)}
        />
      </div>

      <div className="frequency-filter-field">
        <div className="frequency-label-row">
          <label htmlFor="frequency-active-window">
            {translate(frequencyText.activeWindowLabel, language)}
          </label>
          <span
            aria-label={translate(frequencyText.activeWindowHelp, language)}
            className="frequency-help"
            tabIndex={0}
          >
            i
            <span className="frequency-help-tooltip" role="tooltip">
              {translate(frequencyText.activeWindowHelp, language)}
            </span>
          </span>
        </div>
        <div className="frequency-input-with-unit">
          <input
            id="frequency-active-window"
            min={1}
            max={12}
            type="number"
            value={filters.activeWindowMonths}
            onChange={(event) => updateActiveWindow(event.currentTarget.value)}
          />
          <span aria-hidden="true">{formatMonthUnit(filters.activeWindowMonths, language)}</span>
        </div>
      </div>
    </section>
  )
}

function getAgePresetValue(filters: FrequencyFilters, defaultFilters: FrequencyFilters): AgePresetValue {
  if (filters.minAge === defaultFilters.minAge && filters.maxAge === defaultFilters.maxAge) {
    return 'all'
  }

  if (filters.minAge === filters.maxAge) {
    return `age-${filters.minAge}`
  }

  return 'custom'
}

function formatAgeOption(age: number, language: Language) {
  return language === 'pl' ? `${age} lat` : `${age} yo`
}

function formatMonthUnit(value: number, language: Language) {
  if (language === 'pl') {
    return 'mies.'
  }

  return value === 1 ? 'month' : 'months'
}

function PeriodRangeSelect({
  id,
  label,
  language,
  onChange,
  options,
  value,
}: Readonly<{
  id: string
  label: LocalizedText
  language: Language
  onChange: (value: string) => void
  options: FrequencyPeriodRangeOption[]
  value: string
}>) {
  return (
    <div className="frequency-filter-field frequency-filter-compact">
      <label htmlFor={id}>{translate(label, language)}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function MetricCards({
  language,
  metrics,
}: Readonly<{
  language: Language
  metrics: MetricCard[]
}>) {
  return (
    <dl className="frequency-metrics">
      {metrics.map((metric) => (
        <div className="frequency-metric" key={metric.label.en}>
          <dt>{translate(metric.label, language)}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function EventTypeDot({ type }: Readonly<{ type: FrequencyEventType }>) {
  return <span className={`frequency-dot frequency-dot-${type}`} aria-hidden="true" />
}

function AttendanceTimeline({
  language,
  points,
}: Readonly<{
  language: Language
  points: FrequencyEventPoint[]
}>) {
  const chartWidth = 720
  const chartHeight = 220
  const padding = 26
  const innerWidth = chartWidth - padding * 2
  const innerHeight = chartHeight - padding * 2
  const maxCount = Math.max(...points.map((point) => point.count), 1)
  const barStep = points.length > 0 ? innerWidth / points.length : innerWidth
  const [timelineScale, setTimelineScale] = useState<TimelineScale>('even')
  const barWidth =
    timelineScale === 'even'
      ? Math.max(2, Math.min(12, barStep * 0.72))
      : Math.max(3, Math.min(8, barStep * 0.72))
  const [hoverPoint, setHoverPoint] = useState<TimelineHoverPoint | null>(null)
  const firstPointTime = points[0]?.date.getTime() ?? 0
  const lastPointTime = points[points.length - 1]?.date.getTime() ?? firstPointTime
  const timeRange = lastPointTime - firstPointTime
  const pointDateKeys = points.map((point) => point.date.toDateString())
  const duplicateCounts = pointDateKeys.reduce((counts, key) => {
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map<string, number>())
  const duplicateIndexes = pointDateKeys.map((key, index) =>
    pointDateKeys.slice(0, index).filter((previousKey) => previousKey === key).length,
  )

  function getTooltipStyle(point: TimelineHoverPoint): ChartValueStyle {
    return {
      '--tooltip-x': `${(point.x / chartWidth) * 100}%`,
      '--tooltip-y': `${(point.y / chartHeight) * 100}%`,
    }
  }

  return (
    <section className="frequency-panel frequency-panel-wide">
      <div className="frequency-panel-heading">
        <h2>{translate(frequencyText.attendanceOverTime, language)}</h2>
        <div className="frequency-panel-tools">
          <div className="segmented-control frequency-chart-mode" aria-label={translate(frequencyText.timelineModeLabel, language)}>
            <button
              className="segment-button"
              type="button"
              aria-pressed={timelineScale === 'even'}
              onClick={() => setTimelineScale('even')}
            >
              {translate(frequencyText.timelineModeEven, language)}
            </button>
            <button
              className="segment-button"
              type="button"
              aria-pressed={timelineScale === 'proportional'}
              onClick={() => setTimelineScale('proportional')}
            >
              {translate(frequencyText.timelineModeProportional, language)}
            </button>
          </div>
          <div className="frequency-legend">
            {eventTypeOptions
              .filter((option): option is { key: FrequencyEventType; label: LocalizedText } => option.key !== 'all')
              .map((option) => (
                <span key={option.key}>
                  <EventTypeDot type={option.key} />
                  {translate(option.label, language)}
                </span>
              ))}
          </div>
        </div>
      </div>
      {points.length === 0 ? (
        <p className="frequency-empty">{translate(frequencyText.emptyState, language)}</p>
      ) : (
        <HorizontalScrollFrame className="frequency-chart-scroll" refreshKey={`${points.length}-${timelineScale}`}>
            <div className="frequency-chart-stage">
              {hoverPoint && (
                <span className="frequency-chart-tooltip" style={getTooltipStyle(hoverPoint)}>
                  {hoverPoint.label}: {formatNumber(hoverPoint.count, language, 0)}
                </span>
              )}
              <svg
                className="frequency-timeline-chart"
                role="img"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                aria-label={translate(frequencyText.attendanceOverTime, language)}
              >
              <line
                className="frequency-axis"
                x1={padding}
                x2={chartWidth - padding}
                y1={chartHeight - padding}
                y2={chartHeight - padding}
              />
              {points.map((point, index) => {
                const barHeight = (point.count / maxCount) * innerHeight
                const dateKey = pointDateKeys[index]
                const duplicateCount = duplicateCounts.get(dateKey) ?? 1
                const duplicateIndex = duplicateIndexes[index]
                const duplicateOffset =
                  duplicateCount > 1
                    ? (duplicateIndex - (duplicateCount - 1) / 2) * (barWidth + 2)
                    : 0
                const evenCenter = padding + index * barStep + barStep / 2
                const proportionalCenter =
                  timeRange === 0
                    ? padding + innerWidth / 2
                    : padding + ((point.date.getTime() - firstPointTime) / timeRange) * innerWidth
                const centerX =
                  (timelineScale === 'even' ? evenCenter : proportionalCenter + duplicateOffset)
                const clampedCenterX = Math.min(
                  chartWidth - padding - barWidth / 2,
                  Math.max(padding + barWidth / 2, centerX),
                )
                const x = clampedCenterX - barWidth / 2
                const y = chartHeight - padding - barHeight
                const hoverPointValue = {
                  count: point.count,
                  id: point.id,
                  label: point.label,
                  x: clampedCenterX,
                  y: Math.max(20, y - 8),
                }

                return (
                  <rect
                    aria-label={`${point.label}: ${formatNumber(point.count, language, 0)}`}
                    className={`frequency-timeline-bar frequency-timeline-bar-${point.type}`}
                    height={Math.max(1, barHeight)}
                    key={point.id}
                    role="img"
                    rx={2}
                    tabIndex={0}
                    width={barWidth}
                    x={x}
                    y={y}
                    onBlur={() => setHoverPoint(null)}
                    onFocus={() => setHoverPoint(hoverPointValue)}
                    onMouseEnter={() => setHoverPoint(hoverPointValue)}
                    onMouseLeave={() => setHoverPoint(null)}
                    onMouseMove={() => setHoverPoint(hoverPointValue)}
                    onPointerEnter={() => setHoverPoint(hoverPointValue)}
                    onPointerLeave={() => setHoverPoint(null)}
                    onPointerMove={() => setHoverPoint(hoverPointValue)}
                  />
                )
              })}
              </svg>
            </div>
        </HorizontalScrollFrame>
      )}
    </section>
  )
}

function BarListChart({
  emptyText,
  language,
  title,
  values,
  valueFormatter,
  valueMax,
}: Readonly<{
  emptyText?: LocalizedText
  language: Language
  title: LocalizedText
  values: FrequencyMetric[]
  valueFormatter?: (value: number) => string
  valueMax?: number
}>) {
  const maxValue = valueMax ?? Math.max(...values.map((value) => value.value), 1)
  const hasValues = values.some((value) => value.value > 0)

  return (
    <section className="frequency-panel">
      <h2>{translate(title, language)}</h2>
      {!hasValues ? (
        <p className="frequency-empty">{translate(emptyText ?? frequencyText.noData, language)}</p>
      ) : (
        <div className="frequency-bars">
          {values.map((value) => {
            const barValue = maxValue <= 0 ? 0 : (value.value / maxValue) * 100
            const style: ChartValueStyle = {
              '--bar-value': `${value.value > 0 ? Math.max(2, barValue) : 0}%`,
            }

            return (
              <div className="frequency-bar-row" key={value.label}>
                <span>{value.label}</span>
                <span className="frequency-bar-track">
                  <span className="frequency-bar-fill" style={style} />
                </span>
                <strong>{valueFormatter ? valueFormatter(value.value) : formatNumber(value.value, language)}</strong>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function AttendanceByAgeChart({
  language,
  viewModel,
}: Readonly<{
  language: Language
  viewModel: FrequencyViewModel
}>) {
  return (
    <BarListChart
      language={language}
      title={frequencyText.attendanceByAge}
      valueFormatter={(value) => formatPercent(value, language)}
      valueMax={1}
      values={viewModel.attendanceByAge}
    />
  )
}

function FrequencyBucketChart({
  language,
  viewModel,
}: Readonly<{
  language: Language
  viewModel: FrequencyViewModel
}>) {
  return (
    <BarListChart
      language={language}
      title={frequencyText.frequencyDistribution}
      values={viewModel.frequencyBuckets}
    />
  )
}

function MonthlyTable({
  language,
  viewModel,
}: Readonly<{
  language: Language
  viewModel: FrequencyViewModel
}>) {
  return (
    <section className="frequency-panel frequency-panel-wide">
      <h2>{translate(frequencyText.monthlyTable, language)}</h2>
      {viewModel.monthlyRows.length === 0 ? (
        <p className="frequency-empty">{translate(frequencyText.emptyState, language)}</p>
      ) : (
        <HorizontalScrollFrame className="frequency-table-wrap" refreshKey={viewModel.monthlyRows.length}>
          <table className="frequency-table">
            <thead>
              <tr>
                <th>{translate(frequencyText.monthColumn, language)}</th>
                <th>{translate(frequencyText.eventsCount, language)}</th>
                <th>{translate(frequencyText.averageColumn, language)}</th>
                <th>{translate(frequencyText.percentageColumn, language)}</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.monthlyRows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{formatNumber(row.eventCount, language, 0)}</td>
                  <td>{formatNumber(row.averagePresent, language)}</td>
                  <td>{formatPercent(row.attendanceRate, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HorizontalScrollFrame>
      )}
    </section>
  )
}

function FrequencyReadyContent({
  dataset,
  language,
  referenceDate,
}: Readonly<{
  dataset: FrequencyDataset
  language: Language
  referenceDate: Date
}>) {
  const [filters, setFilters] = useState<FrequencyFilters>(() =>
    getFrequencyDefaultFilters(dataset, referenceDate),
  )
  const viewModel = useMemo(
    () => createFrequencyViewModel(dataset, filters, language, referenceDate),
    [dataset, filters, language, referenceDate],
  )

  return (
    <div className="frequency-layout">
      <FrequencyFiltersPanel
        dataset={dataset}
        filters={filters}
        language={language}
        referenceDate={referenceDate}
        onFiltersChange={setFilters}
      />
      <MetricCards language={language} metrics={getMetricCards(viewModel, language)} />
      <AttendanceTimeline language={language} points={viewModel.attendanceOverTime} />
      <div className="frequency-grid">
        <FrequencyBucketChart language={language} viewModel={viewModel} />
        <AttendanceByAgeChart language={language} viewModel={viewModel} />
      </div>
      <MonthlyTable language={language} viewModel={viewModel} />
    </div>
  )
}

function FrequencyPage({ language }: Readonly<{ language: Language }>) {
  const googleFrequencyConfig = useMemo(() => getGoogleFrequencyConfig(), [])
  const referenceDate = useMemo(() => new Date(), [])
  const [frequencyState, setFrequencyState] = useState<FrequencyState>({
    status: googleFrequencyConfig ? 'loading' : 'unconfigured',
  })

  useEffect(() => {
    if (!googleFrequencyConfig) {
      return
    }

    let isActive = true

    fetchGoogleFrequencyDataset(googleFrequencyConfig, referenceDate)
      .then((dataset) => {
        if (!isActive) {
          return
        }

        setFrequencyState({
          dataset,
          status: 'ready',
        })
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setFrequencyState({
          status: 'error',
        })
      })

    return () => {
      isActive = false
    }
  }, [googleFrequencyConfig, referenceDate])

  return (
    <>
      <PageHeading page="frequency" language={language} />
      <section className="content-section">
        <div className="content-width">
          {frequencyState.status === 'loading' && (
            <FrequencyStatusMessage status="loading">
              {translate(frequencyText.loading, language)}
            </FrequencyStatusMessage>
          )}

          {frequencyState.status === 'unconfigured' && (
            <FrequencyStatusMessage status="unconfigured">
              {translate(frequencyText.notConfiguredNotice, language)}
            </FrequencyStatusMessage>
          )}

          {frequencyState.status === 'error' && (
            <FrequencyStatusMessage status="error">
              {translate(frequencyText.errorNotice, language)}
            </FrequencyStatusMessage>
          )}

          {frequencyState.status === 'ready' && (
            <FrequencyReadyContent
              dataset={frequencyState.dataset}
              language={language}
              referenceDate={referenceDate}
            />
          )}
        </div>
      </section>
    </>
  )
}

export { FrequencyPage }
