# C60 · What's the problem

A classroom Live App for one team: five students and one teacher. The shared board runs the C60 design-thinking activity (stakeholder map, fishbone and Why, five-blank problem statements). Student screens carry the steps. The teacher view is a class radar with short walk-over cues.

## Run locally

Postgres is required. The app reads `DATABASE_URL` and creates its tables on first use.

```bash
export DATABASE_URL=postgres://USER:PASSWORD@127.0.0.1:5432/c60
npm install
npm test
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

The teacher opens a room and assigns the five roles. Students join with the four-character room code and tap their name. Each browser tab keeps its own seat.

Published rooms use the Postgres database Cursor provisions for the Live App. Do not commit a real `DATABASE_URL`. Cursor sign-in, when the app is published to a team, sits in front of this app. Publishing happens from the preview tray — this repo does not set a public URL.

## What the room asks for

[docs/screens.md](docs/screens.md) is the screen-by-screen guide: what happens, who fills each field, and how. [docs/section-videos.md](docs/section-videos.md) is the film script. [docs/build-the-next-chunk.md](docs/build-the-next-chunk.md) is the brief to give Grok for the next chunk.

## Scripts

- `npm run dev` — local app on port 43123
- `npm test` — room rules (roles, locks, statement carry)
- `npm run build` / `npm start` — production server
