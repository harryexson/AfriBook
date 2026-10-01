<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working across multiple checkouts and sessions

This repo is worked on from more than one place — this local checkout, a
second local checkout (`AfriBook-fresh`, kept as a fast-forward mirror of this
one), and cloud sessions on claude.ai/code. `main` on GitHub is the single
source of truth. Typical flow: fetch and fast-forward before starting new
work so it builds on the latest state, and land finished, verified work on
`main` promptly rather than letting it sit locally — the longer a change is
local-only, the more likely two checkouts drift and a later merge gets messy.
Normal confirmation rules for git operations still apply per-session; this
section is project context, not a standing permission grant.
