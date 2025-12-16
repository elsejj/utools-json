# AGENTS.md

This document is intended to guide AI agents and developers working on the `utools-json` project. It outlines the technical stack, project structure, and development workflows.

## Technical Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh)
- **Frontend Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Language**: TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/) (currently using `rolldown-vite` experimental build)
- **UI Component Library**: [PrimeVue](https://primevue.org/) v4
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 (integrated with PrimeVue via `tailwindcss-primeui`)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Data Parsing**: `json5`, `yaml`, `smol-toml`
- **Icons**: Iconify

## Project Layout

- **`src/`**: Source code root.
  - **`main.ts`**: Application entry point. Bootstraps Vue with PrimeVue, Pinia, and router (if applicable).
  - **`App.vue`**: Root component.
  - **`components/`**: Vue components (PascalCase). Contains the UI building blocks.
  - **`composables/`**: Vue composables (camelCase, e.g., `useEditorSetting.ts`) for shared state and logic.
  - **`utils/`**: Utility functions, primarily for data transformation.
    - `fromJson.ts`, `toJson.ts`: Core logic for converting between JSON and other formats.
    - `tableJson.ts`: Logic for table-based JSON views.
  - **`workers/`**: Web Workers, specifically for offloading heavy tasks like Monaco Editor initialization/processing.
  - **`assets/`**: Static assets and global styles (`main.css`).
- **`public/`**: Static files served as-is. Includes `plugin.json` which defines the uTools plugin metadata (commands, keywords).
- **`dist/`**: Production build output directory.
- **`doc/`**: Documentation and reference materials.

## Build & Run Commands

All commands are run using `bun`.

- **Install Dependencies**:
  ```bash
  bun install
  ```

- **Start Development Server**:
  ```bash
  bun run dev
  ```
  Starts Vite at `http://localhost:5173` (by default).

- **Build for Production**:
  ```bash
  bun run build
  ```
  Generates optimized assets in `dist/`. Required before packaging for uTools.

- **Preview Production Build**:
  ```bash
  bun run preview
  ```
  Locally preview the production build to verify behavior.

## Coding Guidelines

### Style & Naming
- **Vue Components**: Use PascalCase (e.g., `MonacoEditor.vue`).
- **Composables**: Use camelCase with `use` prefix (e.g., `useTheme.ts`).
- **Indentation**: 2 spaces.
- **Imports**: standard ES imports.
- **CSS**: Use Tailwind utility classes primarily. Custom CSS goes in `src/assets/main.css`.

### Testing
- Currently, manual verification is the primary method.
- Run `bun run dev` and test the JSON parsing, editor features, and diff views.
- Future tests should use Vitest + Vue Test Utils in `src/__tests__/`.

### Version Control
- **Commits**: Short, imperative summaries (e.g., `add json5 support`, `fix toolbar layout`).
- **Lockfile**: Always include `bun.lock` changes when dependencies are modified.

## Release & Distribution
- **uTools Metadata**: Ensure `public/plugin.json` is updated with any new commands or features.
- **Changelog**: meaningful updates in `CHANGELOG.md`.
