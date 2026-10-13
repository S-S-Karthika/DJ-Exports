export const slugify = (text = "") =>
  text
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

// Adds -2, -3... if the slug is already taken.
// `table` is always a fixed name from our own code, never user input.
export const uniqueSlug = async (pool, table, base, excludeId = null) => {
  let slug = base;
  let n = 2;
  for (;;) {
    const [rows] = await pool.query(
      `SELECT id FROM ${table} WHERE slug = ? ${excludeId ? "AND id <> ?" : ""} LIMIT 1`,
      excludeId ? [slug, excludeId] : [slug]
    );
    if (!rows.length) return slug;
    slug = `${base}-${n++}`;
  }
};