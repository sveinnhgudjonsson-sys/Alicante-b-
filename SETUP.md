# Alicante íbúð — Setup Guide

## 1. Prerequisites

Install [Node.js](https://nodejs.org) (LTS version) if not already installed.

## 2. Supabase setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, open **SQL Editor** and paste the contents of `supabase/migrations/001_initial.sql` → Run
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
4. Go to **Authentication → Settings**:
   - Enable **Email** provider (already on by default)
   - Set **Site URL** to your Vercel URL (fill in after deploy, or use `http://localhost:5173` for dev)
   - Add your Vercel URL to **Redirect URLs**

## 3. Resend setup

1. Go to [resend.com](https://resend.com) → Create account → Add a sending domain
2. Create an API key → `RESEND_API_KEY`
3. Verified sender address (must be on your domain) → `RESEND_FROM_EMAIL`
   - Example: `alicante@yourdomain.com`

## 4. Local development

```bash
# Install dependencies
npm install

# Generate PWA icons (once)
npm run generate-icons

# Copy env template and fill in your keys
cp .env.example .env

# Start dev server
npm run dev
```

`.env` should look like:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=alicante@yourdomain.com
```

## 5. Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import project → select the repo
3. Add environment variables in Vercel dashboard (Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
4. Deploy — Vercel auto-detects Vite
5. Copy the deployed URL (e.g. `https://alicante-ibud.vercel.app`) back into Supabase Auth settings

## 6. Install as phone app (PWA)

**iPhone (iOS Safari):** Open the URL → Share button → "Add to Home Screen"  
**Android (Chrome):** Open the URL → three-dot menu → "Install app"

## Colours

| Label | Colour |
|---|---|
| Svenni & Inga | Blue |
| Freyr & Sóley | Green |
| Saman | Red |
| Aðrir gestir | Amber |
