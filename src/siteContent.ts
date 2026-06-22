export type Language = 'pl' | 'en'

export type ThemeName = 'light' | 'dark'

export type PageKey = 'home' | 'schedule' | 'gallery' | 'contact'

export type LocalizedText = Record<Language, string>

export type NavigationItem = {
  key: PageKey
  href: string
  label: LocalizedText
}

export type FooterCredit = {
  label: string
  value: string
}

export type ScheduleCard = {
  title: LocalizedText
  time: LocalizedText
  note: LocalizedText
}

export type Album = {
  title: LocalizedText
  date: LocalizedText
  caption: LocalizedText
  tone: 'gold' | 'violet' | 'purple'
}

export type ParentInfoItem = {
  title: LocalizedText
  body?: LocalizedText
  note?: LocalizedText
  bodyLink?: {
    prefix: LocalizedText
    href: string
    label: LocalizedText
    suffix?: LocalizedText
  }
  details?: Array<{
    title: LocalizedText
    body: LocalizedText
  }>
  link?: {
    href: string
    label: LocalizedText
    tone?: 'subtle' | 'strong'
  }
}

export type ImportantNotice = {
  isActive: boolean
  title: LocalizedText
  body: LocalizedText
}

export const defaultLanguage: Language = 'pl'

export const languageOptions: Array<{ key: Language; label: string }> = [
  { key: 'pl', label: 'PL' },
  { key: 'en', label: 'EN' },
]

export const logoPaths: Record<
  'lightHeader' | 'darkHeader' | 'lightPurple' | 'darkPurple',
  string
> = {
  lightHeader: '/Logo1 - light theme - with circle.svg',
  darkHeader: '/Logo2 - dark theme - with circle.svg',
  lightPurple: '/Logo5 - light theme - for purple background.svg',
  darkPurple: '/Logo6 - dark theme - for purple background.svg',
}

export const navigationItems: NavigationItem[] = [
  { key: 'home', href: '/', label: { pl: 'Start', en: 'Home' } },
  { key: 'schedule', href: '/schedule/', label: { pl: 'Ogarniajzer', en: 'Schedule' } },
  { key: 'gallery', href: '/gallery/', label: { pl: 'Galeria', en: 'Gallery' } },
  { key: 'contact', href: '/contact/', label: { pl: 'Kontakt', en: 'Contact' } },
]

export const commonText = {
  skipToContent: { pl: 'Przejdź do treści', en: 'Skip to content' },
  siteKicker: { pl: 'Parafia Św. Urszuli w Gdyni', en: 'St. Ursula Parish in Gdynia' },
  mainNavigation: { pl: 'Nawigacja główna', en: 'Main navigation' },
  sitePreferences: { pl: 'Ustawienia strony', en: 'Site preferences' },
  openMenu: { pl: 'Otwórz menu', en: 'Open menu' },
  closeMenu: { pl: 'Zamknij menu', en: 'Close menu' },
  languageLabel: { pl: 'Język', en: 'Language' },
  themeLabel: { pl: 'Motyw', en: 'Theme' },
  darkThemeToggle: { pl: 'Ciemny motyw', en: 'Dark theme' },
  lightTheme: { pl: 'Jasny', en: 'Light' },
  darkTheme: { pl: 'Ciemny', en: 'Dark' },
  quickLinks: { pl: 'Szybkie przejścia', en: 'Quick links' },
  schedule: { pl: 'Najbliższy rytm spotkań', en: 'Regular meeting rhythm' },
  upcoming: { pl: 'Najbliższe wydarzenia', en: 'Upcoming events' },
  galleryPreview: { pl: 'Ostatnie albumy', en: 'Recent albums' },
  contactTeaser: { pl: 'Kontakt na miejscu', en: 'Contact in person' },
  viewSchedule: { pl: 'Ogarniajzer', en: 'Schedule' },
  viewGallery: { pl: 'Zobacz galerię', en: 'View gallery' },
  firstSteps: { pl: 'Pierwsze kroki', en: 'First steps' },
  closeModal: { pl: 'Zamknij', en: 'Close' },
  goToContact: { pl: 'Jak porozmawiać', en: 'How to get in touch' },
  externalLinks: { pl: 'Linki zewnętrzne', en: 'External links' },
}

export const scheduleText = {
  loading: {
    pl: 'Pobieramy aktualne wydarzenia z kalendarza.',
    en: 'Loading current events from the calendar.',
  },
  notConfiguredNotice: {
    pl: 'Kalendarz Google nie jest jeszcze podłączony. Po konfiguracji pokażemy tutaj wydarzenia z najbliższych 3 miesięcy.',
    en: 'Google Calendar is not connected yet. After configuration, events from the next 3 months will appear here.',
  },
  errorNotice: {
    pl: 'Nie udało się pobrać wydarzeń z kalendarza Google. Spróbuj odświeżyć stronę później.',
    en: 'Google Calendar events could not be loaded. Try refreshing the page later.',
  },
  emptyState: {
    pl: 'Brak zaplanowanych wydarzeń w najbliższych 3 miesiącach.',
    en: 'There are no scheduled events in the next 3 months.',
  },
  expandEvent: { pl: 'Pokaż szczegóły wydarzenia', en: 'Show event details' },
  collapseEvent: { pl: 'Ukryj szczegóły wydarzenia', en: 'Hide event details' },
  whenLabel: { pl: 'Kiedy', en: 'When' },
  whereLabel: { pl: 'Gdzie', en: 'Where' },
  noteLabel: { pl: 'Informacje', en: 'Details' },
  allDay: { pl: 'cały dzień', en: 'all day' },
  untitledEvent: { pl: 'Wydarzenie', en: 'Event' },
}

export const calendarEventHighlightText = {
  birthday: { pl: 'Urodziny', en: 'Birthday' },
  important: { pl: 'Wa\u017cne', en: 'Important' },
}

export const footerQuote = '„Qui cantat, bis orat”'

export const footerCredits: FooterCredit[] = [
  {
    label: 'Site creator',
    value: 'Marek Maciejewski',
  },
  {
    label: 'Logo creator',
    value: 'Kamil Jadczuk',
  },
  {
    label: 'Tech stack',
    value: 'React, TypeScript, Vite, GitHub Pages',
  },
]

export const pageIntro: Record<
  PageKey,
  { eyebrow: LocalizedText; title: LocalizedText; lead: LocalizedText }
> = {
  home: {
    eyebrow: { pl: 'Scholka Aureolka', en: 'Scholka Aureolka' },
    title: { pl: 'Śpiewamy razem przy parafii', en: 'Singing together at the parish' },
    lead: {
      pl: 'Ciepłe i praktyczne miejsce dla rodziców: terminy prób, najbliższe wydarzenia, zdjęcia i najważniejsze informacje w jednym miejscu.',
      en: 'A warm, practical place for parents: rehearsal times, upcoming events, photos, and key practical information in one place.',
    },
  },
  gallery: {
    eyebrow: { pl: 'Zdjęcia', en: 'Photos' },
    title: { pl: 'Galeria życia scholi', en: 'Gallery of choir life' },
    lead: {
      pl: 'Albumy mogą pokazywać próby, Msze święte i wydarzenia parafialne. Rodzice podpisali zgody na zdjęcia, więc galeria może być rozwijana.',
      en: 'Albums can show rehearsals, Masses, and parish events. Parents have signed photo consents, so the gallery can grow.',
    },
  },
  schedule: {
    eyebrow: { pl: 'Terminy i aktualności', en: 'Dates and updates' },
    title: { pl: 'Ogarniajzer', en: 'Schedule' },
    lead: {
      pl: 'Aktualne miejsce na najbliższe próby, Msze dziecięce, specjalne spotkania, wyjątki i odwołania.',
      en: 'The current place for upcoming rehearsals, Children’s Masses, special gatherings, exceptions, and cancellations.',
    },
  },
  contact: {
    eyebrow: { pl: 'Kontakt', en: 'Contact' },
    title: { pl: 'Porozmawiajmy', en: 'Let’s talk' },
    lead: {
      pl: 'Z osobą prowadzącą można porozmawiać osobiście, najlepiej przed próbą scholi zarówno w czwartek jak i niedzielę.',
      en: 'You can speak with the organizer in person, preferably before choir rehearsal on both Thursday and Sunday.',
    },
  },
}

export const homeHeroCta = {
  schedule: { href: '/schedule/', label: commonText.viewSchedule },
  firstSteps: { label: commonText.firstSteps },
}

export const homeHeroText = {
  description: {
    pl: 'Śpiewamy z dziećmi podczas spotkań parafialnych i Mszy dziecięcej. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum euismod sem at urna luctus, vitae facilisis mi cursus.',
    en: "We sing with children during parish gatherings and Children's Mass. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum euismod sem at urna luctus, vitae facilisis mi cursus.",
  },
  rehearsalsLabel: { pl: 'Próby', en: 'Rehearsals' },
  massLabel: { pl: 'Msza dziecięca', en: "Children's Mass" },
}

export const homeImportantNotice: ImportantNotice = {
  isActive: true,
  title: { pl: 'Ważne!', en: 'Important!' },
  body: {
    pl: 'Najbliższa czwartkowa próba odwołana z powodu święta państwowego.',
    en: 'The next Thursday rehearsal is canceled because of a national holiday.',
  },
}

export const scheduleCards: ScheduleCard[] = [
  {
    title: { pl: 'Próba czwartkowa', en: 'Thursday rehearsal' },
    time: { pl: 'Czwartek, 18:30', en: 'Thursday, 18:30' },
    note: { pl: 'Stały termin spotkania scholi.', en: 'Regular choir meeting time.' },
  },
  {
    title: { pl: 'Próba niedzielna', en: 'Sunday rehearsal' },
    time: { pl: 'Niedziela, 11:00', en: 'Sunday, 11:00' },
    note: {
      pl: 'Przed Mszą dziecięcą, poza okresami świątecznymi.',
      en: 'Before Children’s Mass, outside holiday periods.',
    },
  },
  {
    title: { pl: 'Msza dziecięca', en: 'Children’s Mass' },
    time: { pl: 'Niedziela, 12:00', en: 'Sunday, 12:00' },
    note: {
      pl: 'Obowiązuje poza okresami świątecznymi.',
      en: 'Applies outside holiday periods.',
    },
  },
]

export const albums: Album[] = [
  {
    title: { pl: 'Próby i śpiew', en: 'Rehearsals and singing' },
    date: { pl: 'Album roboczy', en: 'Draft album' },
    caption: {
      pl: 'Miejsce na zdjęcia z regularnych spotkań scholi.',
      en: 'A place for photos from regular choir meetings.',
    },
    tone: 'gold',
  },
  {
    title: { pl: 'Msze dziecięce', en: 'Children’s Masses' },
    date: { pl: 'Album roboczy', en: 'Draft album' },
    caption: {
      pl: 'Kadry z niedzielnych spotkań przy parafii.',
      en: 'Moments from Sunday gatherings at the parish.',
    },
    tone: 'violet',
  },
  {
    title: { pl: 'Wydarzenia parafialne', en: 'Parish events' },
    date: { pl: 'Album roboczy', en: 'Draft album' },
    caption: {
      pl: 'Zdjęcia ze specjalnych wydarzeń i występów.',
      en: 'Photos from special events and performances.',
    },
    tone: 'purple',
  },
]

const consentPdfHref = '/Zgoda.pdf'
const safeguardingStandardsUrl = 'https://www.urszula-gdynia.pl/maloletni.html'

export const firstStepsModal: {
  title: LocalizedText
  items: ParentInfoItem[]
} = {
  title: { pl: 'Pierwsze kroki', en: 'First steps' },
  items: [
    {
      title: { pl: 'Gdzie', en: 'Where' },
      body: {
        pl: 'Czwartki - salka pod schodami.\nNiedziele - kościół.',
        en: 'Thursdays - the room under the stairs.\nSundays - the church.',
      },
    },
    {
      title: { pl: 'Co zabrać', en: 'What to bring' },
      body: {
        pl: 'Coś niesłodkiego do picia i dobry humor.',
        en: 'A non-sweet drink and a good mood.',
      },
    },
    {
      title: { pl: 'Toaleta', en: 'Toilet' },
      body: {
        pl: 'Dostępna na miejscu.',
        en: 'Available on site.',
      },
    },
    {
      title: { pl: 'Papierologia', en: 'Paperwork' },
      body: {
        pl: 'Zgoda na udział i niezależna zgoda na publikację wizerunku dziecka.',
        en: "Consent to participate and separate permission to publish the child's image.",
      },
      note: {
        pl: 'Najlepiej wydrukować dwustronnie.',
        en: 'It is best to print it double-sided.',
      },
      link: consentPdfHref
        ? {
            href: consentPdfHref,
            label: { pl: 'PDF zgody', en: 'Consent PDF' },
            tone: 'strong',
          }
        : undefined,
    },
    {
      title: { pl: 'Strój', en: 'Outfit' },
      details: [
        {
          title: { pl: 'Odświętny, chłodniejszy', en: 'Formal, cooler' },
          body: {
            pl: 'Fioletowa spódnica, złota apaszka i logo mocowane na magnesy. Zwrotna kaucja zestawu to 60,- zł. Czarna baza z długim rękawem we własnym zakresie.',
            en: 'Purple skirt, gold scarf, and logo attached with magnets. The refundable set deposit is PLN 60. The black long-sleeve base is arranged individually.',
          },
        },
        {
          title: { pl: 'Casualowy, cieplejszy', en: 'Casual, warmer' },
          body: {
            pl: 'Fioletowa bluza z logo i fioletowe ogrzewacze na nogi. Zestaw: ~100,- zł; cena zależy od liczby sztuk zamawianych jednorazowo ze względu na stałe koszty nadruku. Czarne gerty we własnym zakresie',
            en: 'Purple hoodie with logo and purple leg warmers. Set: about PLN 100; the price depends on the number of items ordered at one time because printing has fixed setup costs. The black gaiters are arranged individually.',
          },
        },
      ],
    },
    {
      title: { pl: 'Bezpieczeństwo', en: 'Safeguarding' },
      bodyLink: {
        prefix: { pl: 'Obowiązują ', en: '' },
        href: safeguardingStandardsUrl,
        label: { pl: 'standardy ochrony małoletnich', en: 'Safeguarding standards for minors' },
        suffix: { pl: '.', en: ' apply.' },
      },
    },
  ],
}

export const contactDetails = {
  people: [
    {
      role: { pl: 'Prowadzący', en: 'Lead Organizer' },
      name: 'Marek Maciejewski',
    },
    {
      role: { pl: 'Duszpasterz', en: 'Chaplain' },
      name: { pl: 'ks. Marek Styn', en: 'Fr. Marek Styn' },
    },
    {
      role: { pl: 'Wsparcie organizacyjne', en: 'Organizational Support' },
      name: 'Anna Maciejewska',
    },
    {
      role: { pl: 'Wsparcie muzyczne', en: 'Musical Support' },
      name: 'Olga Andrzejewska',
    },
    {
      role: { pl: 'Wsparcie techniczne', en: 'Technical Support' },
      name: 'Piotr Andrzejewski',
    },
  ],
  linksLabel: { pl: 'Przydatne linki', en: 'Useful Links' },
  links: [
    {
      href: 'https://www.facebook.com/people/Scholka-Aureolka/61569393120295/',
      label: 'Facebook',
    },
    {
      href: 'https://www.urszula-gdynia.pl/kontakt.html',
      label: { pl: 'Kontakt Do Parafii', en: 'Parish Contact' },
    },
    {
      href: safeguardingStandardsUrl,
      label: { pl: 'Standardy Ochrony Małoletnich', en: 'Safeguarding Standards For Minors' },
    },
  ],
}

export const weekdayLabels: Record<Language, string[]> = {
  pl: ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}
