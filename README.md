# Baby Name App

A modern web application for searching, analyzing, and managing baby names. This app helps parents find the perfect name for their baby by searching through vast databases of names, viewing popularity trends, and saving favorites.

## Features

- **Name Search**: Search for baby names based on various criteria including gender, meaning, origin, and more
- **Name Analysis**: View detailed analytics about a name including popularity trends, historical data, and cultural significance
- **Favorites System**: Save and organize your favorite names for later reference
- **Pop Culture Names**: Discover names from popular culture sources
- **Multilingual Support**: Application supports internationalization through next-intl

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 18 with Tailwind CSS and Radix UI components
- **State Management**: React Hooks
- **APIs**: Server-side API routes for name data and analysis
- **Data Sources**: SSA (Social Security Administration) name database and pop culture references
- **Internationalization**: next-intl for translations

## Getting Started

### Prerequisites

- Node.js (v18.16.0 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install the dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## Application Structure

- `app/`: Next.js App Router pages and layouts
  - `search/`: Main search functionality
  - `name/`: Individual name details
  - `favorites/`: User's saved names
  - `analyze/`: Name analysis tools
  - `api/`: Backend API endpoints
- `components/`: Reusable React components
- `data/`: Name databases and data utilities
- `lib/`: Utility functions and hooks
- `types/`: TypeScript type definitions
