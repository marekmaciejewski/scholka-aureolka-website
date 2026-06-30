import { describe, expect, test } from 'vitest'
import {
  addCalendarMonths,
  createFrequencyViewModel,
  getAvailableCalendarYearOptions,
  getAvailableSchoolYearOptions,
  getFrequencyDefaultFilters,
  getMemberStatus,
  parseFrequencySheetValues,
} from '../../src/frequency'

const referenceDate = new Date(2026, 5, 30)

function createDataset() {
  return parseFrequencySheetValues(
    [
      {
        range: 'Dane!A1:C10',
        values: [
          ['id', 'data dołączenia', 'data urodzenia'],
          ['1', '01.01.2026', '15.06.2015'],
          ['2', '01.01.2026', '01.07.2014'],
          ['3', '01.01.2026', ''],
          ['4', '01.01.2026', '01.01.2016'],
        ],
      },
      {
        range: "'2026'!A1:F10",
        values: [
          ['id', '02.04.2026', '05.04.2026', '05.04.2026', '26.06.2026', '29.06.2026'],
          ['1', '1', '1', '', '', ''],
          ['2', '', '', '1', '1', ''],
          ['3', '1', '1', '1', '1', '1'],
        ],
      },
    ],
    referenceDate,
  )
}

function createRecentActivityEdgeDataset() {
  return parseFrequencySheetValues(
    [
      {
        range: 'Dane!A1:C10',
        values: [
          ['id', 'data dołączenia', 'data urodzenia'],
          ['9', '01.01.2026', '15.06.2015'],
        ],
      },
      {
        range: "'2026'!A1:D10",
        values: [
          ['id', '26.04.2026', '26.05.2026', '26.06.2026'],
          ['9', '1', '', ''],
        ],
      },
    ],
    referenceDate,
  )
}

describe('frequency data rules', () => {
  test('parses members, ignores missing birth dates, and keeps duplicate event dates', () => {
    const dataset = createDataset()

    expect(dataset.members.map((member) => member.id)).toEqual([1, 2, 4])
    expect(dataset.ignoredMemberIds).toEqual([3])
    expect(dataset.events).toHaveLength(5)
    expect(dataset.events.map((event) => event.type)).toEqual([
      'rehearsal',
      'mass',
      'other',
      'other',
      'other',
    ])
    expect(dataset.events[2].date.toDateString()).toBe(dataset.events[1].date.toDateString())
    expect(dataset.members.find((member) => member.id === 4)?.lastPresenceDate).toBeNull()
  })

  test('uses calendar months for active members', () => {
    const dataset = createDataset()
    const memberOne = dataset.members.find((member) => member.id === 1)
    const memberTwo = dataset.members.find((member) => member.id === 2)

    expect(addCalendarMonths(referenceDate, -2)).toEqual(new Date(2026, 3, 30))
    expect(memberOne && getMemberStatus(memberOne, 2, referenceDate)).toBe('inactive')
    expect(memberTwo && getMemberStatus(memberTwo, 2, referenceDate)).toBe('active')
  })

  test('builds aggregate chart data with active and inactive member end boundaries', () => {
    const dataset = createDataset()
    const filters = getFrequencyDefaultFilters(dataset, referenceDate)
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.totalEventCount).toBe(5)
    expect(viewModel.filteredMemberCount).toBe(3)
    expect(viewModel.averageAttendance).toBe(0.8)
    expect(viewModel.activeMemberCount).toBe(1)
    expect(viewModel.averageFrequency).toBeCloseTo((2 / 3 + 2 / 5) / 3)
    expect(viewModel.medianFrequency).toBeCloseTo(2 / 5)
    expect(viewModel.frequencyBuckets.map((bucket) => bucket.value)).toEqual([1, 1, 1, 0])
    expect(viewModel.attendanceByAge).toEqual([
      { label: '10 yo', value: 0 },
      { label: '11 yo', value: 1 / 2 },
    ])
    expect(viewModel.monthlyRows).toEqual([
      expect.objectContaining({
        attendanceRate: 1 / 3,
        averagePresent: 1,
        eventCount: 3,
        key: '2026-04',
      }),
      expect.objectContaining({
        attendanceRate: 1 / 4,
        averagePresent: 1 / 2,
        eventCount: 2,
        key: '2026-06',
      }),
    ])
  })

  test('uses the global latest event for recent activity and the selected range for active calculations', () => {
    const dataset = createRecentActivityEdgeDataset()
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      periodEnd: new Date(2026, 4, 26),
      periodPreset: 'custom' as const,
      periodStart: new Date(2026, 0, 1),
    }

    const threeMonthActiveViewModel = createFrequencyViewModel(
      dataset,
      { ...filters, activeWindowMonths: 3 },
      'en',
      referenceDate,
    )
    const twoMonthActiveViewModel = createFrequencyViewModel(
      dataset,
      { ...filters, activeWindowMonths: 2 },
      'en',
      referenceDate,
    )
    const inactiveViewModel = createFrequencyViewModel(
      dataset,
      { ...filters, activeWindowMonths: 1 },
      'en',
      referenceDate,
    )

    expect(threeMonthActiveViewModel.activeMemberCount).toBe(1)
    expect(threeMonthActiveViewModel.averageFrequency).toBe(1 / 2)
    expect(twoMonthActiveViewModel.activeMemberCount).toBe(1)
    expect(twoMonthActiveViewModel.averageFrequency).toBe(1 / 2)
    expect(inactiveViewModel.activeMemberCount).toBe(0)
    expect(inactiveViewModel.averageFrequency).toBe(1)
  })

  test('lists available calendar and school years from event dates', () => {
    const dataset = createDataset()

    expect(getAvailableCalendarYearOptions(dataset).map((option) => option.label)).toEqual(['2026'])
    expect(getAvailableSchoolYearOptions(dataset).map((option) => option.label)).toEqual(['2025/26'])
  })

  test('filters default rehearsals, masses, and other events', () => {
    const dataset = createDataset()
    const filters = getFrequencyDefaultFilters(dataset, referenceDate)

    const rehearsalViewModel = createFrequencyViewModel(
      dataset,
      { ...filters, eventType: 'rehearsal' },
      'en',
      referenceDate,
    )
    const massViewModel = createFrequencyViewModel(
      dataset,
      { ...filters, eventType: 'mass' },
      'en',
      referenceDate,
    )
    const otherViewModel = createFrequencyViewModel(
      dataset,
      { ...filters, eventType: 'other' },
      'en',
      referenceDate,
    )

    expect(rehearsalViewModel.totalEventCount).toBe(1)
    expect(rehearsalViewModel.averageAttendance).toBe(1)
    expect(massViewModel.totalEventCount).toBe(1)
    expect(massViewModel.averageAttendance).toBe(1)
    expect(otherViewModel.totalEventCount).toBe(3)
    expect(otherViewModel.averageAttendance).toBeCloseTo(2 / 3)
  })
})
