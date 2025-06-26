This project is a web application that allows users use 'monaco' editor to edit / diff JSON content. It's main features are:

- read clipboard content, try to parse it as JSON, or various JSON formats like Quoted JSON, Base64 JSON, or YAML
- format parsed JSON content, then set it to the editor
- user can copy the content from the editor as various formats like JSON, Quoted JSON, Base64 JSON, or YAML, html table(for paste to excel or google sheet), or JSON representation of the programming language.
- user can diff two JSON content, and see the differences in a side-by-side view

The project is built using the following technologies:

- Vue.js 3 for the frontend framework
- PrimeVue 4 for UI components, we had use auto-import feature, so you don't need to import components manually
- Tailwindcss 4 for styling
- Vite.js for the build tool
- Pinia for state management, state file is located at `src/composables/', with a `use` prefix
- components are located at `src/components/`
- TypeScript as the programming language
- Monaco Editor for the code editor
