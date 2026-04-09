# Verifier UI Repo Guidance

- Use GPT-5.4 by default for standards-sensitive and cross-repo verifier work.
- Treat `project-docs/docs/EIDAS_ARF_Implementation_Brief.md` and `project-docs/docs/AI_Working_Agreement.md` as mandatory constraints.
- This repo owns the verifier web UI and is a primary delivery surface for the Irish Life proof of concept.
- Keep UI journey changes aligned with verifier endpoint contracts and protocol expectations.
- When verifier UI behaviour, environment assumptions, acceptance flow design, or smoke coverage changes, update `project-docs` in the same task.
- Default Git flow in this workspace is local `wip/<stream>` commits promoted directly with `git push origin HEAD:main`; do not publish remote `wip/<stream>` branches unless explicitly requested.

## Local Checks

- `npm run start`
- `npx ng lint`
- `npx ng test --watch=false --browsers=ChromeHeadless`

## Sensitive Areas

- Do not silently change protocol-facing assumptions in the UI layer.
- Keep branding and journey changes separate from unrelated refactors wherever practical.