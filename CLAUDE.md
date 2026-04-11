# CLAUDE.md

## Project Overview

Taxi van booking platform for Comfort Transfer Services (CTS) — a 9-seat taxi van service in Heraklion, Crete.
- Domain: crete-taxivan.gr
- Monorepo with npm workspaces: `packages/frontend`, `packages/backend`, `packages/shared`

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + MongoDB (Mongoose)
- **Shared**: Shared types (`@cts/shared`)
- **Database**: MongoDB Atlas (cluster0.mzndnsh.mongodb.net/easyrider)
- **Hosting**: Render (free tier)
- **Email**: Brevo API (not SMTP — Render free tier blocks ports 587/465). Sender: noreply@crete-taxivan.gr, reply-to: cts.crete@gmail.com

## Commands

- `npm run dev` — run frontend + backend concurrently
- `npm run dev:frontend` — frontend only (Vite, port 5173)
- `npm run dev:backend` — backend only
- `npm run build:production` — build shared + frontend for deploy
- `npm run lint` — lint all workspaces
- `npm run type-check` — type-check all workspaces

## Architecture

### Frontend Structure
- `src/pages/` — route-level pages (Home, BookRide, TransfersIndex, TransferRoute, AdminDashboard, AdminCalendar, AdminSettings, etc.)
- `src/components/` — reusable components (common/, home/, booking/, transfers/)
- `src/contexts/` — React contexts (AuthContext, BookingContext, ToastContext)
- `src/services/` — API service layer
- `src/utils/` — utilities (pricing, distance, airport detection)
- `src/data/` — static data (locations, transferRoutes)
- `src/i18n/` — 6 languages: el, en, fr, de, it, es

### Backend Structure
- `src/routes/` — Express route handlers
- `src/controllers/` — request handlers
- `src/services/` — business logic
- `src/models/` — Mongoose models
- `src/middleware/` — auth, error handling

### Key Components
- `PublicHeader` — reusable header with hamburger sidebar (used in all public pages)
- `Logo` — theme-aware logo (dark: cts-logo-white.png, light: cts-logo-blue.png)
- `WhatsAppButton` — floating contact button (home page only)

## Pricing (IMPORTANT)

- Pricing is dynamic from MongoDB (admin editable at /admin/settings?tab=pricing)
- Frontend uses `loadPricing()` from `utils/pricing.ts` to fetch and cache pricing from the API
- `calculatePrice()` uses the cached pricing, falling back to `DEFAULT_PRICING_TABLE` if not loaded
- **Every page/component that uses `calculatePrice()` must call `loadPricing()` on mount**, otherwise users entering that page directly will see hardcoded default prices instead of the admin-configured ones
- Currently loaded in: Home, TransfersIndex, TransferRoute, BookRide, AdminDashboard
- When adding `calculatePrice()` to a new page, always ensure `loadPricing()` is called there too

## Carousel Images

- Dynamic from MongoDB (CarouselImage model), admin editable at /admin/settings?tab=images
- Two categories: 'hero' (homepage carousel) and 'van' (vehicle section)
- Images stored as base64 in MongoDB (with client-side canvas resize before upload)
- Express body limit set to 10mb for image uploads

## Distance & Routing

- Transfer routes use hardcoded distances from Google Directions API (in `data/transferRoutes.ts`)
- Booking page uses Google Directions API in real-time for distance/duration
- When navigating from transfer page to booking, distance is passed via URL param to avoid inconsistency
- Haversine with road factor (1.35) used only as fallback

## Translations

- 6 languages: el, en, fr, de, it, es (in `src/i18n/locales/`)
- When adding new UI text, add the translation key to ALL 6 locale files
- Admin UI is Greek only

## External Services

- Google Analytics: G-JLD9ZTRRGH
- Google Maps/Directions API for distances
- Brevo API for transactional emails
- Google Business Profile review link: https://g.page/r/CWYiwVG_prseEAE/review
