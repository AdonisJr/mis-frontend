# mis-frontend

Vue 3 + Vite admin / data-management app for MIS. Talks to [mis-backend](../mis-backend) at `VITE_API_URL`.

Stack: Vue 3 (JavaScript), Vue Router, Pinia, Axios, Tailwind CSS 4 (no component library), Laravel Echo + pusher-js (real-time RFID card assignment).

## Requirements

- Node **20.19+ or 22.12+** (Vite 8)

## Setup

```bash
npm install          # .npmrc sets legacy-peer-deps (npm 11.3 peer-resolver bug)
cp .env.example .env
```

## Commands

| Task | Command |
|---|---|
| Dev server (http://localhost:5173) | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
