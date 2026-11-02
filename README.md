# Rehearse

A study app for the senior interview question banks in `../A1`, `../A2`, … Read model answers, practice them with
spaced repetition, and track progress. Fully static: no server, no database, works offline once opened.

## Run it

```bash
npm install
npm run dev          # builds content, then starts the dev server on :3000
```

```bash
npm run build        # content + static export to ./out
npx serve out        # or any static file host
```

Other scripts: `npm test`, `npm run lint`, `npm run typecheck`, `npm run format`.

## What it does

- **Browse** 52 topics (1,100 questions) with filters for level (L1/L2/L3), type (concept/scenario) and status.
- **Practice** with a reveal-and-grade flow. Grades (Again/Hard/Good/Easy) schedule the next review (SM-2 style).
  Keyboard: `Space` reveals, `1`–`4` grade.
- **Search** everything with `Ctrl K` or `/`.
- **Track** done, saved and due questions, a day streak, an activity heatmap and per-level progress.
- **Recall mode** hides answers until revealed. Themes: system, light, dark, sepia.
- **Own your data**: progress lives in the browser; export and import it as JSON from Settings.
- **Installable and offline** (PWA) after the first visit.

## How it is built

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, static export (`output: "export"`), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 with theme tokens (CSS variables), three themes |
| State | Zustand with versioned, schema-validated `localStorage` persistence and cross-tab sync |
| Search | MiniSearch over a prebuilt index (`/data/search.json`), loaded when the palette first opens |
| Content | Markdown → typed JSON at build time (unified, remark, Shiki), validated with Zod |
| Tests | Vitest: parser, renderer, scheduler, deck builder, state validation, store persistence |

### Content pipeline

`npm run content` (also run by `dev` and `build`) reads `../<TRACK>/chunks/NN_CODE_pK.md`, parses every
`### <ID> [CONCEPT|SCENARIO] [L1-3] Subtopic: …` block into labelled sections, renders Markdown to HTML
(code highlighted with Shiki using CSS variables, so themes need no client JS) and writes `public/data`:

```
public/data/manifest.json      tracks, sections, topics and per-question metadata
public/data/topics/<id>.json   one file per topic with the rendered questions
public/data/search.json        the search index
```

The build **fails** on a malformed heading, an unexpected line before a section, a duplicate question id, or a
question missing its required sections. Run it against another folder with `CONTENT_ROOT=path npm run content`.

**Adding a track:** write its chunks in `../A3/chunks`, then add a title and section names for it in
`src/content/config.ts`. Unknown tracks still build; their sections are grouped under "Other".

### Progress storage

Progress is one JSON blob under the `localStorage` key `senior-prep:v1` (see `src/lib/state.ts`). It is validated on
load and on import, and corrupt data falls back to defaults. The store reads it synchronously when it is created in
the browser; do not move that into an effect, because any early write would then overwrite saved progress
(`src/lib/store.test.ts` covers this).

### Offline

`public/sw.js` caches static assets (cache first), note data (stale while revalidate) and pages (network first).
Bump `VERSION` in it to drop all caches. It is registered only in production builds.

## Deploying

`out/` is plain HTML, CSS and JS. Any static host works. URLs end in `/`; on nginx use
`try_files $uri $uri/ =404;`. CI (`.github/workflows/ci.yml`) lints, typechecks, tests and builds against the
fixture track in `tests/fixtures`, because the real notes live outside this repository.

## Layout

```
scripts/build-content.ts     CLI for the content build
src/content/                 parser, renderer, schemas, build orchestration
src/lib/                     scheduler, deck builder, progress maths, store, data loaders
src/components/              UI (client components) and the app shell
src/app/                     routes: /, /topics/[slug], /q/[id], /practice, /saved, /stats, /settings
tests/fixtures/              tiny track used by tests and CI
```
