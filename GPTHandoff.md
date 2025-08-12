### Purpose

Rebuild this application end-to-end using your own implementation approach, while preserving the business logic, data model, and user flows defined in the included specs and briefs. You have creative latitude on component implementation and UI details, but must respect our brand tokens and core UX patterns. Supabase is the backend. Port 3008 is the default for all local examples.

### Scope

- Implement a working Next.js app integrated with Supabase auth and database
- Apply all SQL migrations under `supabase/migrations/` (RLS must remain enforced)
- Implement core pages and flows per the included “page briefs” and specs (Customers, Product Library, Quotes foundation, Dashboard)
- Keep the visual system consistent with our brand tokens; you may invent component styles

### Styling constraints

- Source of truth for styling: this repo’s `src/app/globals.css` and `tailwind.config.js`
- Font: Montserrat
- Primary brand tokens (must respect):
  - navy `#162944` (primary DEFAULT)
  - royal `#203B56`
  - indigo `#345F94`
  - cyan `#29ABE2`
  - amber `#F4B400`
  - neutrals: black `#000000`, silver `#CCCCCC`, charcoal `#292929`, slateGray `#7A7A7A`, alabaster `#FAFAFA`, platinum `#F0F0F0`
- Do not import or rely on CSS from other reference repos; only use the tokens in this repo
- You may design component-level styles freely, provided they adhere to tokens above

### Runtime and environment

- Framework: Next.js 15
- Default dev port: 3008
  - Dev: `next dev --port 3008`
  - Start: `next start -p 3008`
- Bundler: Webpack (do not use Turbopack)
- Environment: We will provide `.env.local` after you deliver the code. Do not commit secrets. Use the provided `env.template`/`.env.example` as the contract for required variables.

### Database

- Backend: Supabase (Postgres + Auth)
- Apply all SQL files in `supabase/migrations/` using the Supabase SQL Editor
- Row Level Security must remain enabled and enforced per the migration files
- Core domain tables present:
  - `customer_accounts`, `customer_contacts` with RLS
  - `products` (seed script provided)

### Deliverables

- A self-contained Next.js app that builds and runs (`npm run build`, `npm run start -p 3008`)
- Supabase integration (auth + DB) aligned with included SQL migrations and policies
- Functional core flows:
  - Customers: CRUD, search/filter, RLS-safe access
  - Product Library: list/import basics (CSV flow reference included)
  - Dashboard skeleton and navigation
- Basic automated tests for at least:
  - Customer CRUD
  - CSV import happy path
- A README with:
  - Install/run instructions (port 3008)
  - How to apply migrations via the Supabase SQL Editor
  - Required env variables (no secrets)

### References included

- This repo’s code and tokens (`src/**`, `tailwind.config.js`, `src/app/globals.css`)
- Specs and briefs from the AV tool project (`.agent-os/product/page-briefs/**`, `.agent-os/specs/**`) for flow guidance
- Supabase migrations from both this repo and the AV tool (you may reconcile into a coherent set)
- Support docs: CSV importer notes, performance summaries

### Constraints and notes

- Keep port 3008 for all examples and scripts
- Avoid Turbopack; assume standard Next build pipeline
- Respect RLS policies exactly as defined unless you propose explicit changes
- Keep artifacts small and dependency choices conservative/stable

### Handoff back plan

We will:
1) Pull your output into our Cursor workspace
2) Provide `.env.local` locally
3) Apply the SQL migrations in Supabase SQL Editor
4) Validate build (`npm run build`) and run (`npm run start -p 3008`)
5) Iterate on UI polish in a follow-up styling phase

