export type Language = 'pl' | 'en'

export type ThemeName = 'light' | 'dark'

export type PageKey = 'home' | 'gallery' | 'calendar' | 'organization' | 'contact'

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

export type InfoSection = {
  title: LocalizedText
  body: LocalizedText
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
  { key: 'gallery', href: '/gallery/', label: { pl: 'Galeria', en: 'Gallery' } },
  { key: 'calendar', href: '/calendar/', label: { pl: 'Kalendarz', en: 'Calendar' } },
  {
    key: 'organization',
    href: '/organization/',
    label: { pl: 'Organizacja', en: 'Organization' },
  },
  { key: 'contact', href: '/contact/', label: { pl: 'Kontakt', en: 'Contact' } },
]

export const commonText = {
  skipToContent: { pl: 'Przejdź do treści', en: 'Skip to content' },
  siteKicker: { pl: 'Parafia Św. Urszuli w Gdyni', en: 'St. Ursula Parish in Gdynia' },
  mainNavigation: { pl: 'Nawigacja główna', en: 'Main navigation' },
  sitePreferences: { pl: 'Ustawienia strony', en: 'Site preferences' },
  openMenu: { pl: 'Otwórz menu', en: 'Open menu' },
  closeMenu: { pl: 'Zamknij menu', en: 'Close menu' },
  menu: { pl: 'Menu', en: 'Menu' },
  languageLabel: { pl: 'Język', en: 'Language' },
  themeLabel: { pl: 'Motyw', en: 'Theme' },
  lightTheme: { pl: 'Jasny', en: 'Light' },
  darkTheme: { pl: 'Ciemny', en: 'Dark' },
  quickLinks: { pl: 'Szybkie przejścia', en: 'Quick links' },
  schedule: { pl: 'Najbliższy rytm spotkań', en: 'Regular meeting rhythm' },
  upcoming: { pl: 'Najbliższe wydarzenia', en: 'Upcoming events' },
  galleryPreview: { pl: 'Ostatnie albumy', en: 'Recent albums' },
  contactTeaser: { pl: 'Kontakt na miejscu', en: 'Contact in person' },
  sourceOfTruth: {
    pl: 'Docelowo ta lista będzie zasilana z publicznego Kalendarza Google i pokaże wydarzenia do 3 miesięcy naprzód.',
    en: 'This list is intended to be powered by a public Google Calendar and show events up to 3 months ahead.',
  },
  viewCalendar: { pl: 'Zobacz kalendarz', en: 'View calendar' },
  viewGallery: { pl: 'Zobacz galerię', en: 'View gallery' },
  readOrganization: { pl: 'Informacje organizacyjne', en: 'Organization details' },
  goToContact: { pl: 'Jak porozmawiać', en: 'How to get in touch' },
  externalLinks: { pl: 'Linki zewnętrzne', en: 'External links' },
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
      pl: 'Ciepłe i praktyczne miejsce dla rodziców: terminy prób, najbliższe wydarzenia, zdjęcia i informacje organizacyjne w jednym miejscu.',
      en: 'A warm, practical place for parents: rehearsal times, upcoming events, photos, and organization details in one place.',
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
  calendar: {
    eyebrow: { pl: 'Terminy', en: 'Dates' },
    title: { pl: 'Kalendarz spotkań i wydarzeń', en: 'Calendar of meetings and events' },
    lead: {
      pl: 'Najważniejszy widok dla rodziców: kiedy jest próba, Msza dziecięca albo specjalne spotkanie.',
      en: 'The most important parent view: when rehearsals, Children’s Mass, or special gatherings happen.',
    },
  },
  organization: {
    eyebrow: { pl: 'Dla rodziców', en: 'For parents' },
    title: { pl: 'Informacje organizacyjne', en: 'Organization details' },
    lead: {
      pl: 'Krótki zestaw praktycznych informacji: kiedy przyjść, gdzie się zebrać i co warto mieć ze sobą.',
      en: 'A short set of practical details: when to arrive, where to gather, and what to bring.',
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

export const homeActions = [
  { href: '/calendar/', label: commonText.viewCalendar },
  { href: '/organization/', label: commonText.readOrganization },
  { href: '/gallery/', label: commonText.viewGallery },
]

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

export const organizationSections: InfoSection[] = [
  {
    title: { pl: 'Kiedy są próby', en: 'When rehearsals happen' },
    body: {
      pl: 'Regularne próby są planowane w czwartki o 18:30 oraz w niedziele o 11:00 przed Mszą dziecięcą.',
      en: 'Regular rehearsals are planned on Thursdays at 18:30 and Sundays at 11:00 before Children’s Mass.',
    },
  },
  {
    title: { pl: 'Gdzie się zebrać', en: 'Where to gather' },
    body: {
      pl: 'Dokładne miejsce zbiórki zostanie dopisane po potwierdzeniu z organizatorem i parafią.',
      en: 'The exact gathering point will be added after confirmation with the organizer and parish.',
    },
  },
  {
    title: { pl: 'Co zabrać', en: 'What to bring' },
    body: {
      pl: 'Na start wystarczy obecność dziecka i gotowość do wspólnego śpiewu. Szczegóły dla konkretnych wydarzeń mogą pojawić się w kalendarzu.',
      en: 'To start, a child only needs to be present and ready to sing together. Details for specific events can appear in the calendar.',
    },
  },
  {
    title: { pl: 'Kontekst parafialny', en: 'Parish context' },
    body: {
      pl: 'Msza dziecięca odbywa się w niedziele o 12:00 poza okresami świątecznymi.',
      en: 'Children’s Mass takes place on Sundays at 12:00 outside holiday periods.',
    },
  },
]

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
      href: 'https://www.urszula-gdynia.pl/maloletni.html',
      label: { pl: 'Standardy Ochrony Małoletnich', en: 'Safeguarding Standards For Minors' },
    },
  ],
}

export const recurringCalendarNotes: InfoSection[] = [
  {
    title: { pl: 'Zakres widoku', en: 'View range' },
    body: {
      pl: 'Kalendarz powinien pokazywać wydarzenia od dziś do 3 miesięcy naprzód.',
      en: 'The calendar should show events from today through 3 months ahead.',
    },
  },
  {
    title: { pl: 'Źródło danych', en: 'Data source' },
    body: {
      pl: 'Po podłączeniu publicznego Kalendarza Google ten widok powinien być źródłem aktualnych terminów na stronie.',
      en: 'After connecting the public Google Calendar, this view should become the site’s current schedule source.',
    },
  },
]

export const weekdayLabels: Record<Language, string[]> = {
  pl: ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

export const eventTemplates = [
  {
    weekday: 4,
    hour: 18,
    minute: 30,
    title: { pl: 'Próba scholi', en: 'Choir rehearsal' },
    location: { pl: 'Parafia', en: 'Parish' },
    note: { pl: 'Stała próba czwartkowa.', en: 'Regular Thursday rehearsal.' },
  },
  {
    weekday: 0,
    hour: 11,
    minute: 0,
    title: { pl: 'Próba przed Mszą dziecięcą', en: 'Rehearsal before Children’s Mass' },
    location: { pl: 'Parafia', en: 'Parish' },
    note: {
      pl: 'Niedzielna próba poza okresami świątecznymi.',
      en: 'Sunday rehearsal outside holiday periods.',
    },
  },
  {
    weekday: 0,
    hour: 12,
    minute: 0,
    title: { pl: 'Msza dziecięca', en: 'Children’s Mass' },
    location: { pl: 'Kościół parafialny', en: 'Parish church' },
    note: {
      pl: 'Niedzielna Msza dziecięca poza okresami świątecznymi.',
      en: 'Sunday Children’s Mass outside holiday periods.',
    },
  },
]
