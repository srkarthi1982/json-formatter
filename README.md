# JSON Formatter

Clean and format JSON data. This repo powers JSON Formatter inside the Ansiversa ecosystem and follows the current shared mini-app contract.

## Current app structure

- Public landing page on `/`
- Protected app entry on `/app`
- Shared Ansiversa shell, navbar, footer, and auth boundary
- Current `@ansiversa/components` version: `^0.0.169`

## Commands

```bash
npm install
npm run typecheck
npm run build
```

## Notes

- Update `src/app.meta.ts` only if the app registry identity changes.
- Keep middleware, layout, and shared component patterns aligned with the current Ansiversa mini-app contract.
- Update `AGENTS.md` after every completed task.
