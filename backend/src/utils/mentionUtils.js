const MENTION_TOKEN_REGEX = /@\[[^\]]+\]\(([a-f\d]{24})\)/gi;

export function extractMentionedUserIds(body) {
  if (!body) {
    return [];
  }

  const ids = new Set();
  const regex = new RegExp(MENTION_TOKEN_REGEX);
  let match;

  while ((match = regex.exec(body)) !== null) {
    ids.add(match[1]);
  }

  return [...ids];
}

export function filterValidMentionUserIds(mentionedUserIds, allowedUserIds, authorId) {
  const allowed = new Set(allowedUserIds.map((id) => id.toString()));
  const author = authorId?.toString?.() ?? authorId;

  return mentionedUserIds.filter(
    (userId) => allowed.has(userId) && userId !== author
  );
}
