# Developer Codex

A strictly monochrome, offline-capable "second brain" for builders — a personal
**logbook**, project **archive**, and methodology **playbook**, all driven by
local MDX files. Built with the Next.js App Router, TypeScript, and Tailwind.

The entire design system is grayscale by rule: hierarchy comes from True Black,
True White, a neutral gray spectrum, borders, spacing, and typographic weight —
never color.

## The three pillars

| Pillar | Route | Purpose |
| --- | --- | --- |
| **Logbook** | `/logbook` | A chronological ledger of entries (private timeline; `noindex`). |
| **Archive** | `/archive` | A tiered project showcase (`portfolio` / `demo` / `archive`) in a masonry grid, with the deep legacy history one toggle away. |
| **Playbook** | `/playbook` | A hierarchical, docs-style wiki of methodologies and specs. |

## Features

- **Command Center dashboard** (`/`) — activity heatmap + latest shipped project, active systems, and recent logs.
- **Global search** — `Cmd/Ctrl+K` fuzzy command palette (fuse.js) over a static, privacy-filtered search index.
- **Cross-pillar tags** — `/tags/[tag]` aggregates everything sharing a tag across all three pillars.
- **Bi-directional links** — Obsidian-style `[[wiki-links]]` with a server-side backlink graph; unresolved links degrade to visible stubs.
- **Bespoke MDX components** — `<SpecSheet>`, `<TerminalBlock>`, `<MechanicFlow>`, `<Changelog>`, `<PromptVault>`, `<WikiLink>`, available in any `.mdx` without imports.
- **Local-first CMS** (`/editor`, dev-only) — author entries with generated frontmatter, paste/drop image upload (auto-compressed to `.webp` via `sharp`), and a "Grill Me" Gemini assistant.
- **Installable PWA** — offline-resilient with aggressive text caching and capped media caching.

## Getting started

```bash
cd app-projects
npm install
npm run dev          # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

### Optional: the "Grill Me" AI assistant

The local editor includes an optional Gemini-powered assistant. To enable it:

```bash
cp .env.example .env.local
# then add your key from https://aistudio.google.com/
```

```
GEMINI_API_KEY=your_key_here
```

It is only used by the dev-only editor; the rest of the app runs without it.

## Deploy to Vercel

The app lives in the `app-projects/` subdirectory, so set the **Root Directory**
accordingly when importing.

1. Push the repo to GitHub (already done).
2. On [vercel.com](https://vercel.com/new), **Add New → Project** and import the repo.
3. Set **Root Directory** to `app-projects`. Framework (Next.js), build command
   (`next build`), and output are auto-detected — leave them default.
4. Environment variables: none required. (`GEMINI_API_KEY` is optional and only
   used by the dev-only editor, which is 404'd in production anyway.)
5. **Deploy.**

What you'll see in production (by design — the Vault Guardrail):

- Public pillars render: dashboard, Archive, Playbook, tags, full-text search,
  and the three themes on `/settings`.
- `/editor`, the bulk inbox, and CMS telemetry are **404** (local-only tools).
- Any entry marked `visibility: private` or `draft` is filtered out.

## Authoring content

Each pillar reads `.mdx` files from `content/<pillar>/`. Frontmatter contracts:

- **Logbook** — `title`, `date`, `location`, `tags[]`, `summary`
- **Archive** — `title`, `year`, `tier`, `category`, `visibility`, `hero_media`, `tech_stack[]`
- **Playbook** — `title`, `category`, `last_updated`, `status`, `tags[]`

Run locally and visit **`/editor`** to author entries through the UI instead of
hand-writing frontmatter. The editor and image pipeline write to the local
filesystem and are automatically disabled in production.

## Project structure

```
app-projects/
├── app/            # App Router routes, API route, server actions, editor
├── components/     # UI + bespoke MDX components (components/mdx)
├── content/        # logbook / archive / playbook MDX source
├── lib/            # MDX parsing, tag taxonomy, backlink graph, telemetry
├── public/         # static assets, media uploads, PWA manifest + icons
└── types/          # shared frontmatter and domain types
```

## Security & deployment notes

- The **Logbook is never indexed** by search and excludes itself from the public search index; `visibility: private` Archive entries are excluded too.
- Filesystem-writing actions (content + media) **throw in production** so a read-only host (e.g. Vercel) never crashes.
- The PWA service worker (`public/sw.js`, `workbox-*`, `swe-worker-*`) is generated at build time and gitignored.

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · MDX
(`@mdx-js/mdx`, `next-mdx-remote`, `gray-matter`) · `fuse.js` · `sharp` ·
`@ducanh2912/next-pwa` · `@google/generative-ai`.
