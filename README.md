# YiYi AI — AI-Powered Outfit Planner

YiYi AI is a full-stack web application that helps users plan their daily outfits using AI. It analyzes your wardrobe, checks the local weather, and generates personalized outfit recommendations complete with an AI-composed outfit image.

---

## Features

- **AI Outfit Generation** — Describes and visually composes outfit recommendations based on occasion, weather, and personal style
- **Smart Wardrobe Management** — Upload clothing items; AI automatically analyzes and tags each piece (category, color, style, material, etc.)
- **Weather-Aware Suggestions** — Fetches real-time weather for any location and date to ensure appropriate outfit choices
- **Semantic Search** — Uses vector embeddings to semantically match wardrobe items to outfit requests
- **Outfit History** — Saves every generated outfit so users can revisit past looks
- **User Authentication** — Email/password and Google OAuth sign-in via Supabase Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| AI / LLM | Google Gemini (gemini-2.5-flash / imagen) |
| Image Processing | Sharp |
| Weather | Google Weather API |
| Schema Validation | Zod |
| Embeddings | Gemini text-embedding-004 |

---

## Project Structure

```
src/
├── app/
│   ├── api/                  # Next.js API routes
│   │   ├── locations/        # Location autocomplete & details
│   │   ├── outfit/generate/  # Core outfit generation endpoint
│   │   └── wardrobe/         # Wardrobe CRUD & batch processing
│   ├── auth/                 # Login / register / OAuth callback pages
│   ├── components/
│   │   ├── ai_service/       # Service UI components
│   │   ├── auth/             # Auth form components
│   │   └── home/             # Landing page components
│   ├── contexts/             # React contexts (Auth, History, Models)
│   ├── service/              # Protected service pages
│   │   ├── create/           # Outfit generation page
│   │   ├── wardrobe/         # Wardrobe management page
│   │   ├── history/          # Past outfits page
│   │   └── collection/       # Saved collections page
│   ├── dashboard/            # User dashboard
│   ├── pricing/              # Pricing page
│   └── showcase/             # Showcase page
└── lib/
    ├── llm/                  # Gemini LLM calls, schemas, prompts
    ├── image/                # Image generation & stitching
    ├── wardrobe/             # Wardrobe analysis & processing logic
    ├── outfit/               # Outfit recommendation logic
    ├── embedding/            # Vector embedding helpers
    ├── weather/              # Weather fetching
    ├── supabase/             # Supabase client (browser, server, admin)
    └── validators/           # Zod validators
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_WEATHER_API_KEY=your_google_weather_api_key
GEMINI_API_KEY=your_gemini_api_key
ENABLE_PRODUCT_IMAGE_GENERATION=true
```

### Database Setup

Apply the Supabase migrations in order:

```bash
supabase db push
```

Or run the SQL files in `supabase/migrations/` manually via the Supabase dashboard.

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com). Set all environment variables in your Vercel project settings before deploying.

```bash
vercel deploy
```

---

## Future Improvements

### 1. Personalized Style Learning

Build a personalized style learning system that adapts to user preferences, feedback, and wearing patterns over time. By tracking which outfits users accept, modify, or dismiss, the system can gradually develop a personal style profile for each user — enabling recommendations that feel increasingly tailored and intuitive.

### 2. AI Fashion Intelligence Enhancement

Enhance outfit recommendations by integrating deeper fashion knowledge, professional styling principles, and expert-informed rules. By leveraging structured style taxonomies and retrieval-based fashion guidance, the AI can move beyond basic matching logic and produce recommendations aligned with real-world professional styling practices — accounting for factors like color theory, silhouette balance, and occasion-appropriate dressing.
