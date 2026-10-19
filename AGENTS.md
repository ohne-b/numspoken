# Agent instructions

Read contributing.md before editing or reviewing. This is the canonical harness;
do not create alternate agent instruction files or checked-in planning documents.

- Use descriptive feat/ or fix/ branches and conventional commits, with no assistant branding.
- Preserve user changes. Ordinary work goes through a PR against ohne-b/numspoken:main.
- Integrate current main before final validation. Record exact tested and reviewed revisions.
- Before merge readiness, delegate an independent read-only adversarial review to a separate
  reviewer agent (or obtain independent human review). The author cannot approve their own work.
  Resolve blocking findings and request a fresh review of substantive fixes. Keep incomplete PRs in draft.
- Do not deploy or publish a release merely because code was merged. Pages publication is manual.
- Keep user guidance in README, contributor policy in CONTRIBUTING, changes in CHANGELOG.

## Architecture and contracts

React + TypeScript + Vite + Tailwind, browser-only. Hash navigation has practice,
settings and language guides. Guides pause practice without clearing the answer.
No backend, analytics, accounts, runtime CDN, or saved answers. Preferences alone use localStorage.
Use @mdi/react with individual @mdi/js paths; icon-only actions need accessible names and tooltips.
The footer links to GitHub using mdiGithub. The supplied coral SVG is the brand.

src/lib owns the explicit n2words locale registry, lazy converters/fonts, random generation,
and Unicode-aware answer comparison. src/features owns practice and settings.
Native textarea editing is mirrored for coloring; preserve IME, selection, undo, wrapping,
RTL and forced colors. Grading uses whole candidate answers and the longest correct prefix.
Never strip combining marks globally. Input composition suspends grading and auto-advance.
Session transitions count a departed problem once; reveal alone never counts or succeeds.
Number selection uses an in-memory shuffled cycle per range, retained across rounds and
non-range settings changes. Reloading or changing the range resets it. Never persist exclusions.
Settings suspend practice; valid changes persist immediately and restart practice on return.
Theme alone does not restart. Cancel stale async work/timers. Storage failure stays usable.

## Validation

Use Node from .nvmrc and npm ci. Run npm run check, then npm run test:browser against the
built dist. Playwright is the repository browser workflow; it starts a production preview
on port 4173 and refuses server reuse. Test the /numspoken/ base path, both themes,
keyboard access, RTL, composition, storage failure and small screens.
Synthetic composition is not a substitute for physical IME testing; disclose that limitation.
The 72-variant converter smoke suite does not certify linguistic correctness.
Keep notices for all distributed code, fonts and flag assets. The project is source available
under PolyForm Noncommercial; third-party licenses retain their own terms.
