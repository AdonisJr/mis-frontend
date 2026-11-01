# mis-frontend — Quick Reference

> Full context, architecture and rules: [AGENTS.md](AGENTS.md). Read it first.

## Run

```bash
npm run dev
```

## Common commands

```bash
npm install              # .npmrc keeps legacy-peer-deps=true
cp .env.example .env     # VITE_API_URL=http://localhost:8000/api/mis, VITE_PUSHER_*
npm run build            # the only automated check (no test or lint tool installed)
npm run preview          # serve the production build
```

Requires Node 20.19+ or 22.12+ (Vite 8). The build fails on Node 20.18.

## Ports

| Service | Port |
|---|---|
| Vite dev server (mis-frontend) | 5173 |
| mis-backend API (dependency) | 8000 |

## Agents

- `fe-developer` implements a plan: `claude --agent fe-developer -p "Implement .claude/common/plans/active/<slug>/plan-fe.md"`
- `fe-auditor` audits staged changes before commit

Shared plans/rules/wiki come from the `mis` workspace via the `.claude/common` and `.claude/diagrams` symlinks. If they're broken, run `node tools/setup-links.js` in the workspace.
