# Go To Web — FunPortfolio

A single-page portfolio at the [Go To Web](https://github.com/Tellivision/funportfolio) one-person web design studio. Three sections stacked in a GSAP-driven cinematic scroll: hero → about → gallery. Mobile gets the same cinematic with two touch-tuned motions (instant scrub, no elastic bounce).

## Stack

- Plain HTML, one CSS file, one JS file. **No build step.**
- [GSAP 3.15](https://greensock.com/gsap/) + ScrollTrigger (CDN, deferred)
- Google Fonts: Bebas Neue + DM Sans
- Hero video + raster images under `public/`

## Run locally

Any static HTTP server works. From the project root:

```bash
python -m http.server 8000
# or
npx --yes http-server -p 8000
```

Open `http://localhost:8000`. The page works just as well opened as `file://` since there is no build.

## Deploy to Vercel

Vercel auto-detects this as a static site. A small `vercel.json` is committed to pin the framework and output directory explicitly — without it Vercel's auto-detection can fail to find the root `index.html` when a `public/` asset folder is present, returning a 404 on the deployment URL. Just:

1. Push this repo to GitHub (the initial push is in `git log`).
2. In Vercel, "Import Project" → select this repo.
3. Vercel will detect "Other" framework and serve `index.html` at the root. Click **Deploy**.

The committed `vercel.json` sets `framework: null`, `buildCommand: null`, `outputDirectory: "."` so no project-settings tweaking is needed. No env vars. The first deploy should take under 30 seconds. See [Vercel docs on static deployments](https://vercel.com/docs/concepts/deployments/static-deployments) for the auto-detection rules.

Optional: connect a custom domain under Vercel → Project → Domains.

## File structure

```
.
├── AGENTS.md       # how the AI coding agent should behave on this project
├── HANDOFF.md      # historical session-by-session notes (kept for context)
├── README.md       # this file
├── vercel.json     # pins Vercel to static + `outputDirectory: "."`
├── index.html      # entry point
├── hero.css        # all styles (~15 KB)
├── hero.js         # all GSAP animations (~8 KB)
├── .gitignore
└── public/
    ├── hero.mp4    # ~12 MB, used in hero section (autoplay muted)
    ├── logo.png    # 500x500
    ├── hero.png    # 1825x862, reused 3x in bento cards
    ├── headshot.png # 500x500, reused 3x in bento cards + about
    └── work.png    # 2648x1508, gallery banner
```

## Architecture notes

- The cinematic is one GSAP master timeline scrubbed by `ScrollTrigger` over `+=400%` of viewport (desktop; `+=300%` on touch). Four implicit phases: rising → about reveals → HOLD (read-pause) → crossfade to gallery with elastic card bounce.
- All positioning, opacity, and z-index of the three sections are GSAP-owned via `gsap.set()` and `gsap.timeline`. CSS handles default flow for the reduced-motion / no-JS fallback.
- `matchMedia('(prefers-reduced-motion: no-preference)')` gates the cinematic; reduced-motion users see all three sections stacked in document flow with no motion.
- See `AGENTS.md` for the agent contract (lazy senior dev, minimum viable diff, no new dependencies).
