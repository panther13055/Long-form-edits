# Longform Studio

A browser-based 16:9 long-form video builder for character transformation/reveal videos.

## Features
- Up to 15 character sections
- 3-stage flow per character: text intro → original/cartoon image → reveal/IRL image
- Shared name/subtitle overlays on stages 2 and 3
- Custom text color, accent color, style and position
- Per-stage duration controls
- Fade, slide, zoom, wipe and flash transitions
- Background music + per-character reveal SFX
- Live timeline preview
- Client-side WebM export (Chrome/Edge recommended)
- Project JSON save/load
- No ranking UI or ranking logic

## Run locally
Open `index.html` directly, or run:

```bash
python -m http.server 5173
```

Then visit `http://localhost:5173`.

## Deployment
This is a static site, so it can be deployed directly to Vercel from GitHub with no build command.
