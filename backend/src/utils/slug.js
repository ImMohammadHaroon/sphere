export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueOrgSlug(Organization, baseName) {
  let slug = slugify(baseName);
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists = await Organization.exists({ slug: candidate });
    if (!exists) return candidate;
    suffix += 1;
  }
}
