# Coinmate Fintech Platform

This project uses Vite with React. Environment variables are required for Supabase and quest configuration.

Copy `.env.example` to `.env` and provide your own values:

```
cp .env.example .env
```

Then edit `.env` and set the following variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GET_STARTED_QUESTID`
- `VITE_QUEST_USER_ID`
- `VITE_QUEST_APIKEY`
- `VITE_QUEST_TOKEN`
- `VITE_QUEST_ENTITYID`
- `VITE_QUEST_PRIMARY_COLOR`

These variables will be loaded via `import.meta.env` at runtime.
