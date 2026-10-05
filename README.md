# Yu-Gi-Oh Card Printer

A web application for creating and printing custom Yu-Gi-Oh! cards. The app allows users to search cards from the YGOPRODeck API, build decks, and export them for printing.

Read this in [English](README.md) | [Tiếng Việt](README.vi.md)

## Features

- 🔍 **Advanced Search**: Search cards from YGOPRODeck database with pagination support
- 📄 **Pagination**: Browse through thousands of results with efficient pagination (50 cards per page)
- ⚡ **High Performance**: Optimized with lazy loading, virtualization, and multi-layer caching
- 🎴 **Card Details**: Rich detail modal — full-resolution art, stats band, Link-arrow grid, Rank display for Xyz monsters, official attribute orbs, TCG/OCG ban status, sets with rarity/prices
- 🔗 **Related Cards**: From any card's detail modal, jump to all cards sharing its archetype (exact match, custom cards excluded)
- 👤 **Custom Card Authors**: Custom cards show their creator's profile name in the detail modal
- 🌐 **Bilingual UI**: Full Vietnamese / English interface with one-click switcher in the header (persisted)
- ⌨️ **Smart Suggestions**: Keyboard-navigable search suggestions (↑↓/Enter/Esc) with history and one-click history clear
- 🏷️ **Ban Status**: Real-time TCG/OCG ban status checking
- ➕ **Custom Cards**: Create and manage your own custom cards
- 🃏 **Deck Builder**: Build decks with Main Deck, Extra Deck, and Side Deck sections
- 📤 **Export & Print**: Export cards with custom print settings and layouts
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and shadcn-ui
- 📱 **Responsive Design**: Optimized for both mobile and desktop devices
- 🔐 **Authentication**: Secure user authentication with Supabase
- 💾 **Cloud Storage**: Store and manage decks in the cloud
- 🚀 **Fast Search**: Debounced search with intelligent API optimization
- 🔍 **SEO Optimized**: Complete meta tags, structured data, Open Graph, and sitemap for better search visibility

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn-ui, Framer Motion
- **Backend**: Supabase (Database, Authentication, Storage)
- **API**: YGOPRODeck API with custom caching client
- **Performance**: React.lazy, Intersection Observer, Virtual Scrolling
- **Build Tool**: Vite with code splitting
- **Package Manager**: npm
- **Deployment**: GitHub Pages with CI/CD

## Installation and Setup

### System Requirements

- Node.js 20+
- npm (`package-lock.json` is the source of truth)

### Installation

1. Clone the repository:

```bash
git clone <YOUR_GIT_URL>
cd yu-gi-oh-card-printer
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file (`.env.local` also works) and configure environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

4. Run the application:

```bash
npm run dev
```

The application will run at `http://localhost:8080`

## Usage

1. **Sign up or log in** to your account for cloud storage and deck management.
2. **Pick a language** (VI/EN) from the switcher in the header — the whole UI, including toasts, follows your choice.
3. **Search for cards** using the advanced search panel with filters and pagination.
3. **Browse results** efficiently with pagination - view 50 cards per page from thousands of results.
4. **Add cards to deck** by clicking on them or using drag-and-drop in deck builder.
5. **Organize your deck** with Main Deck (up to 60 cards), Extra Deck (up to 15 cards), and Side Deck (up to 15 cards).
6. **Export and print** your deck with custom settings and professional layouts.

### Search Features

- **Instant Search**: Real-time search with 300ms debounce for optimal performance
- **Advanced Filters**: Filter by card type, attribute, level, ATK/DEF, archetype, and more
- **Pagination**: Navigate through large result sets efficiently
- **Dual Search**: Searches both card names and descriptions for comprehensive results
- **Smart Caching**: Supabase cache first with automatic YGOPRODeck API fallback on cache miss, plus 24-hour in-memory API caching
- **Keyboard-first suggestions**: Arrow-key navigation, instant search on Enter, clearable history

### Performance Optimizations

- **Lazy Loading**: Images and components load only when needed
- **Virtualization**: Card grids render only visible items for smooth scrolling
- **Code Splitting**: Automatic route-based code splitting for faster initial loads
- **API Optimization**: Intelligent caching, retry logic, and rate limiting

## Build and Deploy

### Build for Production

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

### Automatic Deployment

The application is automatically deployed to GitHub Pages when pushing to the main/master branch via GitHub Actions.

## Project Structure

```
src/
├── components/          # UI components
│   ├── cards/          # Card-related components (grid, modal, filters, suggestions)
│   ├── deck/           # Deck building components
│   ├── export/         # Export and print components
│   ├── layout/         # Layout components (Header with language switcher)
│   └── ui/             # UI components from shadcn-ui
├── hooks/              # Custom React hooks (useAuth, useBanList, useDeck)
├── i18n/               # Vietnamese/English dictionaries + LanguageContext
├── integrations/       # External integrations (Supabase)
├── lib/                # Utilities and services
├── pages/              # Application pages
└── types/              # TypeScript type definitions
```

`public/` holds static assets including the official attribute orb SVGs (`DARK.svg` … `WIND.svg`) used in the card detail modal.

## API and Services

- **YGOPRODeck API**: Comprehensive Yu-Gi-Oh card database with advanced search capabilities
- **Custom API Client**: Built-in multi-layer caching (Supabase cache + 24h in-memory), retry logic, rate limiting, in-flight deduplication, and transparent API fallback on cache miss
- **Supabase**: Full-stack backend with real-time database, authentication, and file storage
- **Custom Card Service**: Local storage and management for user-created cards, with author attribution via profiles
- **Deck Service**: Cloud synchronization and local caching for deck management
- **i18n**: Zero-dependency Vietnamese/English system (`src/i18n/`), persisted per user
- **Image Optimization**: Lazy loading and viewport-based image loading for performance

## Recent Updates

### v2.1.0 - Search Reliability, i18n & Card Detail Redesign

- 🌐 **Bilingual UI**: Complete Vietnamese/English interface with header switcher
- 🔍 **Search reliability**: cache-miss API fallback, description search in cache, exact-match archetype search, `plfts` fix for the Supabase 400 tsquery errors
- 🎴 **Card detail redesign**: asymmetric art-rail layout, stat band, Link-arrow grid, Rank for Xyz, official attribute orbs, TCG/OCG ban rows, sets/prices, Related Cards button
- ⌨️ **Suggestion dropdown**: keyboard navigation, theme-aware highlight, clear-history button
- 👤 **Author labels** on custom cards; exact-only related-card results (no custom-card pollution)
- 🛠️ **Filter sheet**: flexible-height scroll area with pinned action bar

### v2.0.0 - Performance & UX Improvements

- ✨ **Pagination System**: Browse through thousands of cards with efficient pagination
- ⚡ **Performance Optimization**: 24-hour API caching, lazy loading, and virtualization
- 🔍 **Enhanced Search**: Faster search with intelligent API optimization and debouncing
- 🎨 **UI Improvements**: Better responsive design and modern pagination controls
- 🛠️ **Code Quality**: Improved TypeScript types and error handling

### Key Performance Improvements

- **Search Speed**: Reduced API calls by ~50% with intelligent caching
- **Load Times**: Code splitting and lazy loading reduce initial bundle size
- **Memory Usage**: Virtualized grids prevent memory issues with large result sets
- **User Experience**: Smooth pagination and instant search feedback

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

If you have any questions or suggestions, please create an issue on GitHub.

Made with Love Cray7
