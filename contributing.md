# Contributing

Use Node 24.22.0 and npm 11.19.1. Run `npm ci`, then `npm run dev`.

Before a PR, run:

```sh
npm run check
npx playwright install chromium firefox webkit
npm run test:browser
```

Use `feat/` or `fix/` branches and focused conventional commits. Open a draft PR against
`ohne-b/numspoken:main`. Incorporate current main before final validation and review.
Record commands, results, tested commit, independent reviewer and reviewed commit in the PR.
Disclose unrun checks. Resolve blocking findings and obtain a recheck after substantive fixes.
The author cannot act as their own independent reviewer. An independent read-only review
agent is allowed. Keep incomplete work in draft; green CI alone is not review.

Keep changes focused, accessible, and free of credentials or generated build output.
Add regression tests for behavior changes. Update README for essential user/setup changes,
AGENTS for architecture/contracts, and CHANGELOG for changes users should know about.
Do not add repository planning documents or duplicate agent instructions.

When merging is authorized, use a merge commit with a conventional title and PR number.
Ordinary merges validate but do not publish. Pages publication is a manual Validation run
on main with `publish` enabled; it deploys the exact built and browser-tested artifact.
Create version tags and releases only when explicitly requested, using the validated commit
and CHANGELOG notes. Do not rebuild an already validated artifact for publication.

## Language fixes

Report the variant, number, generated wording, proposed wording, and a reliable linguistic
source. Prefer a correction upstream in n2words; accepted alternatives here need a source
and regression fixture. Never add fuzzy grading or unconditional accent removal across scripts.
When upgrading n2words, compare its exported locale files with the registry and rerun all
language checks. Font additions need the original license and representative script checks.

## Guides

Guide text lives in `content/guides/en/<language>.md`, one English-written guide
per language. Regional and script differences belong in that same file. The
registry in `src/lib/guides/guide-registry.ts` connects languages to filenames
and assigns scripts to variant sections. Files load only when opened.

Start with one `# <Language> numbers` title, then `## Quick reference` with
`###` groups and ordinary Number/Word tables. `## Larger numbers` uses the same
table format. Follow with short explanations and a final `## Sources` list.
Each heading must have a unique slug within the file. Link to a section with
`[text](#heading-slug)`; the renderer keeps it in the guide's hash route.

Use `**bold**` for the part of a number worth noticing and `*italics*` for a
word in the practice language. The app gives those words their language, font
and direction. Keep layout, HTML and JSX out of the Markdown.

Use concrete rules and examples. Leave out introductions, encouragement and
recaps. Check number spellings against a linguistic reference before comparing
them with n2words; agreement with the converter alone proves nothing. Cite the
references under Sources. Practice supports whole numbers through 999,999,999,999.

`npm test` checks language coverage, heading links and table examples against
practice grading. Browser tests cover guide navigation, fonts, themes and layout.
These checks do not replace native-speaker proofreading.

Use kebab-case filenames throughout the repository. `npm run check:names` checks
tracked and unignored files. `AGENTS.md`, `ISSUE_TEMPLATE` and GitHub's
`pull_request_template.md` retain the names required by their tools.

## Licensing

Contributions are offered under [PolyForm Noncommercial 1.0.0](license.md).
Retain third-party notices and do not copy code from repositories without a suitable license.
Behavioral inspiration from diminumero is acknowledged; its code is not included.
