# Repository Guidelines

## Project Structure & Module Organization
`src/main.ts` bootstraps the Vue 3 app with PrimeVue, Pinia, and Monaco helpers. Vue components live in `src/components/` using PascalCase file names, while shared logic belongs under `src/composables/` (e.g., `useEditorSetting.ts`). Utility helpers reside in `src/utils/`, and long-running editor tasks run inside `src/workers/monaco.ts`. Keep static assets in `src/assets/` and uTools metadata under `public/plugin.json`. Production bundles land in `dist/`, and reference material stays in `doc/`.

## Build, Test, and Development Commands
- `bun install` installs dependencies; commit the updated `bun.lock` whenever versions change.
- `bun run dev` launches the Vite dev server (default `http://localhost:5173`) with hot reloading for rapid UI validation.
- `bun run build` outputs an optimized bundle to `dist/`, ready for packaging as a uTools plugin.
- `bun run preview` serves the production build locally so you can sanity-check routing, assets, and editor behaviour.

## Coding Style & Naming Conventions
Write TypeScript with Vue 3 single-file components, keeping indentation at two spaces and aligning braces per the existing files. Components stay PascalCase (`MonacoEditor.vue`), composables are camelCase with a `use` prefix, and background workers adopt lowercase filenames. Maintain ES module imports and terminate multi-line statements with semicolons for consistency. Tailwind utility classes belong in templates, while shared styling tweaks should be centralized in `src/assets/main.css`.

## Testing Guidelines
Automated tests are not wired up yet, so manually verify new behaviour via `bun run dev`, paying attention to JSON parsing, diff comparison, and editor settings flows. If you add tests, use Vitest plus Vue Test Utils, mirror feature names in filenames (`MonacoEditor.spec.ts`), and place them alongside the source under `src/__tests__/`. Document new test scripts in `package.json` so contributors can discover them quickly.

## Commit & Pull Request Guidelines
Mirror the existing short, imperative commit style (`add tab`, `use vite:rolldown`). Keep related changes in a single commit and include `bun.lock` updates when dependencies shift. Pull requests must describe the user-facing change, call out manual or automated testing, and attach screenshots or GIFs for UI adjustments. Highlight any edits to `public/plugin.json` so reviewers can verify uTools command metadata before merge.

## Distribution & Plugin Tips
Always sync `public/plugin.json` with new commands, shortcuts, or icons. Before publishing, rebuild with `bun run build`, review the generated `dist/` assets, and bundle them according to the uTools store submission process. Capture version bumps in `CHANGELOG.md` when preparing a release.
