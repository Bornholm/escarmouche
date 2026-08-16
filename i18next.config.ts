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
    ignoredAttributes: ['aria-label', 'role', 'data-target', 'aria-hidden', 'accept'],
    // Clés construites dynamiquement (`t(\`ranks.${rank}\`)`) : l'extracteur ne
    // peut pas les voir dans le source et les supprimerait à chaque passage.
    // Toute nouvelle famille de clés indexée par une valeur du moteur doit être
    // ajoutée ici, sinon elle disparaîtra au prochain `extract --sync-primary`.
    preservePatterns: [
      "ranks.*",
      "archetypes.*",
      "stats.*",
      "predefinedUnits.*",
      "theme.*",
      "battle.difficulties.*",
      "battle.legend.*",
      "battle.legendShape.*",
      "battle.status.*",
      "battle.statusShort.*",
      "units.sortBy.*"
    ]
  },
  types: {
    input: "barracks/locales/**/*.json",
    output: "barracks/resources.d.ts"
  }
});
