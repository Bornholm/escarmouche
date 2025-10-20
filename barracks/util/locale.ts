

export function normalizeLocale(locale: string): string {
  const main = locale.slice(0, 2)
  return `${main.toLowerCase()}-${main.toUpperCase()}`
}