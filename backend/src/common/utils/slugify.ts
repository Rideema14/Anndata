/** Turns "Organic Wheat Seeds (5kg)" into "organic-wheat-seeds-5kg". */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Appends a short random suffix to keep a slug unique on collision. */
export function slugifyUnique(text: string): string {
  return `${slugify(text)}-${Math.random().toString(36).slice(2, 7)}`;
}
