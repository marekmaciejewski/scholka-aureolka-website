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
        range: 'Dane!A1:D10',
        values: [
          ['id', 'data dołączenia', 'data odejścia', 'data urodzenia'],
          ['1', '01.01.2026', '', '15.06.2015'],
          ['2', '01.01.2026', '', '01.07.2014'],
          ['3', '01.01.2026', '29.06.2026', ''],
          ['4', '01.01.2026', '', '01.01.2016'],
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

function createSingleMemberDataset(
  eventDates: string[],
  presenceMarkers: string[],
  leaveDate = '',
) {
  return parseFrequencySheetValues(
    [
      {
        range: 'Dane!A1:D2',
        values: [
          ['id', 'data dołączenia', 'data odejścia', 'data urodzenia'],
          ['9', '01.01.2026', leaveDate, '15.06.2015'],
        ],
      },
      {
        range: "'2026'",
        values: [
          ['id', ...eventDates],
          ['9', ...presenceMarkers],
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
    expect(dataset.members.every((member) => member.leaveDate === null)).toBe(true)
  })

  test('reads departure from column C and birth date from column D', () => {
    const dataset = createSingleMemberDataset(['26.06.2026'], ['1'], '26.06.2026')

    expect(dataset.members).toEqual([
      expect.objectContaining({
        age: 11,
        birthDate: new Date(2015, 5, 15),
        joinDate: new Date(2026, 0, 1),
        lastPresenceDate: new Date(2026, 5, 26),
        leaveDate: new Date(2026, 5, 26),
      }),
    ])
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

  test('uses historical activity for both the active count and frequency percentages', () => {
    const dataset = createSingleMemberDataset(
      ['26.04.2026', '26.05.2026', '26.06.2026'],
      ['1', '', ''],
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      activeWindowMonths: 1,
      periodEnd: new Date(2026, 4, 26),
      periodPreset: 'custom' as const,
      periodStart: new Date(2026, 0, 1),
    }

    const historicalViewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)
    const inactiveViewModel = createFrequencyViewModel(
      dataset,
      { ...filters, periodEnd: referenceDate },
      'en',
      referenceDate,
    )

    expect(historicalViewModel.activeMemberCount).toBe(1)
    expect(historicalViewModel.averageFrequency).toBe(1 / 2)
    expect(historicalViewModel.medianFrequency).toBe(1 / 2)
    expect(historicalViewModel.attendanceByAge).toEqual([{ label: '11 yo', value: 1 / 2 }])
    expect(historicalViewModel.monthlyRows.map((row) => row.attendanceRate)).toEqual([1, 0])
    expect(inactiveViewModel.activeMemberCount).toBe(0)
    expect(inactiveViewModel.averageFrequency).toBe(1)
    expect(inactiveViewModel.monthlyRows.map((row) => row.attendanceRate)).toEqual([1, null, null])
  })

  test.each([
    { activeWindowMonths: 1, activeMemberCount: 0, frequency: 1 },
    { activeWindowMonths: 2, activeMemberCount: 1, frequency: 1 / 3 },
    { activeWindowMonths: 3, activeMemberCount: 1, frequency: 1 / 3 },
  ])('uses the selected $activeWindowMonths-month threshold when departure is empty', ({
    activeWindowMonths,
    activeMemberCount,
    frequency,
  }) => {
    const dataset = createSingleMemberDataset(
      ['26.04.2026', '26.05.2026', '26.06.2026'],
      ['1', '', ''],
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      activeWindowMonths,
      periodEnd: referenceDate,
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.activeMemberCount).toBe(activeMemberCount)
    expect(viewModel.averageFrequency).toBe(frequency)
  })

  test.each([1, 2, 12])('explicit departure overrides a %i-month activity window', (activeWindowMonths) => {
    const dataset = createSingleMemberDataset(
      ['26.05.2026', '26.06.2026'],
      ['1', ''],
      '26.05.2026',
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      activeWindowMonths,
      periodEnd: new Date(2026, 4, 27),
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.totalEventCount).toBe(1)
    expect(viewModel.activeMemberCount).toBe(0)
    expect(viewModel.averageFrequency).toBe(1)
  })

  test.each([
    { day: 26, activeMemberCount: 1, totalEventCount: 3 },
    { day: 27, activeMemberCount: 0, totalEventCount: 3 },
    { day: 30, activeMemberCount: 0, totalEventCount: 4 },
  ])('includes all departure-day events and evaluates activity on June $day', ({
    day,
    activeMemberCount,
    totalEventCount,
  }) => {
    const dataset = createSingleMemberDataset(
      ['25.06.2026', '26.06.2026', '26.06.2026', '29.06.2026'],
      ['', '1', '1', ''],
      '26.06.2026',
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      periodEnd: new Date(2026, 5, day),
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.activeMemberCount).toBe(activeMemberCount)
    expect(viewModel.totalEventCount).toBe(totalEventCount)
    expect(viewModel.averageFrequency).toBeCloseTo(2 / 3)
    expect(viewModel.medianFrequency).toBeCloseTo(2 / 3)
    expect(viewModel.frequencyBuckets.map((bucket) => bucket.value)).toEqual([0, 0, 1, 0])
    expect(viewModel.attendanceByAge).toEqual([{ label: '11 yo', value: 2 / 3 }])
    expect(viewModel.monthlyRows[0].attendanceRate).toBeCloseTo(2 / 3)
  })

  test.each([
    { periodEnd: new Date(2026, 4, 26), activeMemberCount: 1, frequency: 1 / 2 },
    { periodEnd: new Date(2026, 5, 26), activeMemberCount: 0, frequency: 1 },
  ])('ignores a later departure and presence when evaluating $periodEnd', ({
    periodEnd,
    activeMemberCount,
    frequency,
  }) => {
    const dataset = createSingleMemberDataset(
      ['26.04.2026', '26.05.2026', '26.06.2026', '29.06.2026'],
      ['1', '', '', '1'],
      '29.06.2026',
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      activeWindowMonths: 1,
      periodEnd,
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(dataset.members[0].lastPresenceDate).toEqual(new Date(2026, 5, 29))
    expect(viewModel.activeMemberCount).toBe(activeMemberCount)
    expect(viewModel.averageFrequency).toBe(frequency)
  })

  test('limits a future selected end to the current reference date', () => {
    const dataset = createSingleMemberDataset(
      ['26.04.2026', '26.05.2026', '26.06.2026', '26.07.2026'],
      ['1', '', '', '1'],
      '26.07.2026',
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      activeWindowMonths: 1,
      periodEnd: new Date(2026, 7, 31),
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.totalEventCount).toBe(3)
    expect(viewModel.activeMemberCount).toBe(0)
    expect(viewModel.averageFrequency).toBe(1)
    expect(viewModel.attendanceOverTime.map((event) => event.count)).toEqual([1, 0, 0])
  })

  test.each([
    { latestPresence: '', activeMemberCount: 0, frequency: 1 },
    { latestPresence: '1', activeMemberCount: 1, frequency: 1 / 2 },
  ])('uses all event types for activity when the latest Mass presence is "$latestPresence"', ({
    latestPresence,
    activeMemberCount,
    frequency,
  }) => {
    const dataset = createSingleMemberDataset(
      ['02.04.2026', '10.05.2026', '04.06.2026', '28.06.2026'],
      ['1', '1', '', latestPresence],
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      activeWindowMonths: 1,
      eventType: 'rehearsal' as const,
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.totalEventCount).toBe(2)
    expect(viewModel.activeMemberCount).toBe(activeMemberCount)
    expect(viewModel.averageFrequency).toBe(frequency)
  })

  test('retains earlier activity when the selected period contains no events', () => {
    const dataset = createSingleMemberDataset(
      ['26.04.2026', '26.05.2026'],
      ['1', ''],
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      activeWindowMonths: 1,
      periodStart: new Date(2026, 5, 1),
      periodEnd: new Date(2026, 5, 20),
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.activeMemberCount).toBe(1)
    expect(viewModel.totalEventCount).toBe(0)
    expect(viewModel.averageFrequency).toBeNull()
    expect(viewModel.medianFrequency).toBeNull()
    expect(viewModel.monthlyRows).toEqual([])
  })

  test('does not count future attendance when the selected period predates every event', () => {
    const dataset = createSingleMemberDataset(['26.06.2026'], ['1'], '26.06.2026')
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      periodEnd: new Date(2026, 4, 31),
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.activeMemberCount).toBe(0)
    expect(viewModel.totalEventCount).toBe(0)
    expect(viewModel.averageFrequency).toBeNull()
  })

  test('excludes a departed member from frequency denominators in a later period', () => {
    const dataset = createSingleMemberDataset(
      ['26.05.2026', '26.06.2026'],
      ['1', ''],
      '26.05.2026',
    )
    const filters = {
      ...getFrequencyDefaultFilters(dataset, referenceDate),
      periodStart: new Date(2026, 5, 1),
    }
    const viewModel = createFrequencyViewModel(dataset, filters, 'en', referenceDate)

    expect(viewModel.activeMemberCount).toBe(0)
    expect(viewModel.totalEventCount).toBe(1)
    expect(viewModel.averageFrequency).toBeNull()
    expect(viewModel.monthlyRows[0].attendanceRate).toBeNull()
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
