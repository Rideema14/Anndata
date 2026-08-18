/** Turns "Organic Wheat Seeds (5kg)" into "organic-wheat-seeds-5kg". */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Appends a short random suffix to keep a slug unique on collision. */
function slugifyUnique(text) {
  return `${slugify(text)}-${Math.random().toString(36).slice(2, 7)}`;
}

module.exports = { slugify, slugifyUnique };
