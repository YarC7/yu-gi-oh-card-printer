# Yu-Gi-Oh Card Printer

A web application for creating and printing custom Yu-Gi-Oh! cards. The app allows users to search cards from the YGOPRODeck API, build decks, and export them for printing.

Read this in [English](README.md) | [Tiếng Việt](README.vi.md)

## Features

- 🔍 Search cards from YGOPRODeck database
- 🎴 View card details with high-quality images
- 🃏 Build decks with Main Deck, Extra Deck, Side Deck sections
- 📤 Export and print cards with custom settings
- 🎨 Beautiful UI with Tailwind CSS and shadcn-ui
- 📱 Responsive design for mobile and desktop
- 🔐 User authentication with Supabase
- 💾 Store decks in the database

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn-ui
- **Backend**: Supabase (Database, Authentication, Storage)
- **API**: YGOPRODeck API
- **Build Tool**: Vite
- **Package Manager**: npm/bun
- **Deployment**: GitHub Pages

## Installation and Setup

### System Requirements

- Node.js 20+
- npm or bun

### Installation

1. Clone the repository:

```bash
git clone <YOUR_GIT_URL>
cd yu-gi-oh-card-printer
```

2. Install dependencies:

```bash
npm install
# or
bun install
```

3. Create `.env.local` file and configure environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

4. Run the application:

```bash
npm run dev
# or
bun run dev
```

The application will run at `http://localhost:5173`

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
│   ├── cards/          # Card-related components
│   ├── deck/           # Deck building components
│   ├── export/         # Export and print components
│   ├── layout/         # Layout components
│   └── ui/             # UI components from shadcn-ui
├── hooks/              # Custom React hooks
├── integrations/       # External integrations (Supabase)
├── lib/                # Utilities and services
├── pages/              # Application pages
└── types/              # TypeScript type definitions
```

## API and Services

- **YGOPRODeck API**: Provides Yu-Gi-Oh card data
- **Supabase**: Database, Authentication, and Storage
- **Custom Card Service**: Manages custom cards
- **Deck Service**: Manages decks

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

If you have any questions or suggestions, please create an issue on GitHub.
