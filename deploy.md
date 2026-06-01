# Deployment Guide

## 1. Install

```bash
npm install
```

## 2. Configure Supabase

```bash
cp .env.example .env.local
```

Fill in:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GITHUB_PAGES_URL=https://your-username.github.io/podo-menswear-trainer
```

Run `supabase-schema.sql` in the Supabase SQL editor.

## 3. Test Locally

```bash
npm run dev
```

Use `TARO` for staff mode.
Use `MANAGER` for manager mode.

## 4. Build

```bash
npm run build
```

## 5. Deploy To GitHub Pages

Create a GitHub repository named `podo-menswear-trainer`.

Then run:

```bash
npm run deploy
```

Live URL:

```text
https://your-username.github.io/podo-menswear-trainer/
```

## Notes

The Vite `base` is set to `/podo-menswear-trainer/`.
Change it in `vite.config.js` if your GitHub repository uses a different name.
