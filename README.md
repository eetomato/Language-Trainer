# Menswear Language Trainer

Internal MVP for Japanese menswear retail staff.

The first lesson teaches size and fit expressions through:

- YouTube video embed
- Predicate-position grammar comparison
- Vocabulary table
- Real service example sentences
- Fill-in-the-blank, matching, and roleplay practice
- Staff dashboard and manager dashboard
- Supabase-ready storage with localStorage fallback

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL that Vite prints.

Use these MVP logins:

- `TARO`, `KEN`, `MARK`, `YUKI` for staff
- `MANAGER` for manager dashboard

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase-schema.sql` in the SQL editor.
3. Create `.env.local` from `.env.example`.
4. Add your Supabase URL and anon key.

The app works without Supabase for local demos.
Practice results save to browser storage first, then Supabase when configured.

## Project Structure

```text
src/
  components/
    Admin/
    Dashboard/
    LessonPage/
    Layout.jsx
    Login.jsx
  hooks/
    useAuth.js
    useDashboard.js
    useLesson.js
  utils/
    analytics.js
    dataFormatter.js
    sampleData.js
    supabaseClient.js
```

## Phase 2 Roadmap

- Replace no-password MVP login with Supabase Auth or manager-issued staff codes.
- Add lesson CRUD for vocabulary, examples, and question sets.
- Add store manager roles and row-level security policies by store.
- Add speaking practice through the Web Speech API.
- Add spaced repetition for weak vocabulary.
