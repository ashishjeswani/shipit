# ShipIt — Deployment Approval Portal (FE)

Frontend for a web portal where APPROVERs review and approve/reject DEVELOPERs' post-deployment scripts, per release cycle, with live realtime updates.

- **Backend API contract (source of truth):** [docs/BACKEND_API_GUIDE.md](docs/BACKEND_API_GUIDE.md)
- **Frontend design spec:** [docs/frontend/00-overview.md](docs/frontend/00-overview.md) — architecture, folder structure, data model, API/hook map, realtime design, state management, auth, UI architecture, error handling, build plan.
- **Claude Code skill for FE work:** [.claude/skills/shipit-fe/SKILL.md](.claude/skills/shipit-fe/SKILL.md)

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
