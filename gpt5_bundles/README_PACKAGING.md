### GPT-5 Packaging (File-based)

This folder provides manifests for three bundles to share with GPT-5 without running any shell commands.

Key constraints:
- Port: 3008 (dev and start)
- Styling: Use ONLY v03 CSS (`src/app/globals.css`) and `tailwind.config.js`. Ignore CSS from other repos.
- Supabase: Apply SQL in `supabase/migrations/` via SQL Editor; keep RLS.

Bundles:
1) `volteus-v03-core.manifest.txt` — the core, runnable app bundle from this repo
2) `av-tool-reference.manifest.txt` — specs/page-briefs/migrations from AV tool (no CSS)
3) `field-tech-module.manifest.txt` — field team module sources

How to use these manifests:
- In your GPT-5 session, attach the files listed in each manifest (absolute paths below) using your editor’s multi-file picker, or zip them externally if needed.
- Exclude any paths under the EXCLUDES blocks.

See also: `../GPTHandoff.md` for explicit deliverables and constraints.

