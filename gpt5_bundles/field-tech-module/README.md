# Field Tech Module (Bundle)

This folder mirrors the field team UI module for GPT‑5 integration. It is a self-contained, typed React/TypeScript module focused on field operations (Projects + Service Calls).

What’s included
- Source: `index.ts`, `src/FieldApp.tsx`, `src/types.ts`, `src/utils/date.ts`
- Components: `src/components/**` (Task pages, tabs, modals, header, table, status pill, etc.)
- Demo state: `src/store/demoData.ts` (kept to demonstrate flows; replace with real data when integrating)

What’s intentionally excluded
- No external CSS files from other repos; brand styling comes from the core app (Montserrat, primary `#162944`).

Usage
- As a demo page: render `FieldApp` anywhere in a client route.
  ```tsx
  import { FieldApp } from "./field-tech-module";
  export default function Page() {
    return <FieldApp />;
  }
  ```
- For granular usage, import individual components and types from `index.ts`.

Integration notes
- Styling: Expect Tailwind CSS and Montserrat to be globally available in the host app. Primary brand color `#162944` is referenced in classnames.
- Data: Replace `src/store/demoData.ts` with your data layer. Primary integration points:
  - Task updates: `TaskDetailPage` receives `onUpdateTask(taskId, partial)`
  - Help requests: `handleHelpSubmit({ selectedTask, recipient, message })` in `FieldApp`
  - Clock in/out: `executeClockIn(taskId)` and `performClockOut(taskId)` flows in `FieldApp`
- Pictures: `PicturesTab` currently previews local images via object URLs; swap in your storage uploader.

Dependencies
- Requires Tailwind CSS and `lucide-react` icons to be available in the host app.
  - Install: `npm i lucide-react`

Notes
- Dates are handled in local time via `src/utils/date.ts` to avoid UTC drift (`YYYY-MM-DD` strings).
- Keep demo data during initial GPT‑5 build; it demonstrates flows end‑to‑end and can be removed later.