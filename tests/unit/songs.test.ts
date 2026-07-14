import { afterEach, describe, expect, test, vi } from 'vitest'
import type { GoogleSongsConfig } from '../../src/core'
import {
  fetchGoogleSongsDataset,
  getAbsoluteSongHref,
  getSongHref,
  getSongSlugFromLocation,
  parseSongsSheetValues,
  replaceSongUrl,
} from '../../src/songs'

function stubLocation(url: string) {
  const nextUrl = new URL(url)

  window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
}

function mockJsonFetch(responses: unknown[]) {
  const fetchMock = vi.fn(async () => {
    const response = responses.shift()

    if (!response) {
      throw new Error('Unexpected fetch')
    }

    return {
      json: async () => response,
      ok: true,
    }
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

afterEach(() => {
  window.history.replaceState({}, '', '/')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('songs sheet parsing', () => {
  test('groups links by song, keeps blank-url songs, and creates unique slugs', () => {
    const dataset = parseSongsSheetValues([
      {
        range: 'Sections!A1:E4',
        values: [
          ['key', 'titlePl', 'titleEn', 'order', 'active'],
          ['general', 'Ogólne', 'General', '10', 'TRUE'],
          ['koledy', 'Kolędy', 'Christmas Carols', '20', 'TRUE'],
          ['hidden', 'Ukryte', 'Hidden', '30', 'FALSE'],
        ],
      },
      {
        range: 'Songs!A1:F8',
        values: [
          ['title', 'sectionKey', 'labelPl', 'labelEn', 'url', 'active'],
          ['Barka', 'general', 'YouTube', '', 'https://youtu.be/example', 'TRUE'],
          ['Barka', 'general', 'Wersja 2', 'Version 2', 'https://example.com/barka', 'TRUE'],
          ['Oto jest dzień', 'general', '', '', '', 'TRUE'],
          ['Oto jest dzień', 'koledy', '', '', '', 'TRUE'],
          ['Niepoprawny link', 'general', '', '', 'javascript:alert(1)', 'TRUE'],
          ['Ukryta', 'general', '', '', 'https://example.com/hidden', 'FALSE'],
          ['Brak sekcji', 'missing', '', '', 'https://example.com/missing', 'TRUE'],
        ],
      },
    ])

    expect(dataset.sections.map((section) => section.key)).toEqual(['general', 'koledy'])
    expect(dataset.songs.map((song) => song.title)).toEqual([
      'Barka',
      'Niepoprawny link',
      'Oto jest dzień',
      'Oto jest dzień',
    ])
    expect(dataset.songs.map((song) => song.slug)).toEqual([
      'barka',
      'niepoprawny-link',
      'oto-jest-dzien',
      'oto-jest-dzien-2',
    ])
    expect(dataset.songs[0].links).toHaveLength(2)
    expect(dataset.songs[0].links[1]).toMatchObject({
      label: { en: 'Version 2', pl: 'Wersja 2' },
      url: 'https://example.com/barka',
    })
    expect(dataset.songs[1].links).toHaveLength(0)
  })

  test('fetches the configured sheet tabs through the Google Sheets API', async () => {
    const config: GoogleSongsConfig = { apiKey: 'api-key', spreadsheetId: 'songs-sheet' }
    const fetchMock = mockJsonFetch([
      {
        valueRanges: [
          {
            range: 'Sections!A1:E2',
            values: [
              ['key', 'titlePl', 'titleEn', 'order', 'active'],
              ['general', 'Ogólne', 'General', '10', 'TRUE'],
            ],
          },
          {
            range: 'Songs!A1:F2',
            values: [
              ['title', 'sectionKey', 'labelPl', 'labelEn', 'url', 'active'],
              ['Barka', 'general', 'YouTube', '', 'https://youtu.be/example', 'TRUE'],
            ],
          },
        ],
      },
    ])

    const dataset = await fetchGoogleSongsDataset(config)
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))

    expect(requestUrl.pathname).toBe('/v4/spreadsheets/songs-sheet/values:batchGet')
    expect(requestUrl.searchParams.getAll('ranges')).toEqual(['Sections', 'Songs'])
    expect(dataset.songs[0]).toMatchObject({
      slug: 'barka',
      title: 'Barka',
    })
  })
})

describe('song URL helpers', () => {
  test('reads, writes, and builds song links', () => {
    stubLocation('http://localhost:5173/songs/?song=Oto jest dzień (2)')

    expect(getSongSlugFromLocation()).toBe('oto-jest-dzien-2')
    expect(getSongHref('barka')).toBe('/songs/?song=barka')
    expect(getAbsoluteSongHref('barka')).toBe('http://localhost:3000/songs/?song=barka')

    replaceSongUrl('kiedy-fale-morz')
    expect(window.location.pathname).toBe('/songs/')
    expect(window.location.search).toBe('?song=kiedy-fale-morz')

    replaceSongUrl(null)
    expect(window.location.search).toBe('')
  })
})
