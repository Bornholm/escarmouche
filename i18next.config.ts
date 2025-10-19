import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: [
    "fr",
    "en",
    "es"
  ],
  extract: {
    input: "barracks/**/*.{ts,tsx,js,jsx}",
    output: "barracks/locales/{{language}}/{{namespace}}.json",
    ignoredTags: ['IgnoreTrans'],
    ignoredAttributes: ['aria-label', 'role', 'data-target', 'aria-hidden', 'accept']
  },
  types: {
    input: "barracks/locales/**/*.json",
    output: "barracks/resources.d.ts"
  }
});