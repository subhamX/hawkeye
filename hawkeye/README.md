# HawkEye - AWS Cost Optimization Platform

HawkEye is a modern web application that simplifies AWS management by providing intelligent cost optimization and resource monitoring recommendations.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Runtime**: Bun
- **AI Integration**: Vercel AI SDK v5 with Google Gemini
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with Google OAuth

## Getting Started

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required environment variables.

3. **Run the development server**:
   ```bash
   bun dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   └── ui/             # shadcn/ui components
└── lib/                # Utility functions and configurations
    ├── utils.ts        # General utilities
    └── ai.ts           # AI SDK configuration
```

## Environment Variables

See `.env.example` for all required environment variables:

- `GOOGLE_GENERATIVE_AI_API_KEY`: Google Gemini API key
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: NextAuth secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `DATABASE_URL`: PostgreSQL connection string

## Development

- **Linting**: `bun lint`
- **Formatting**: `bun format`
- **Type checking**: `bun build` (includes type checking)

## Features

- 🔐 Google OAuth authentication
- 🎨 Modern UI with shadcn/ui components
- 🤖 AI-powered recommendations with Google Gemini
- 📱 Responsive design with Tailwind CSS v4
- ⚡ Fast development with Bun runtime
- 🔒 Type-safe with TypeScript strict mode