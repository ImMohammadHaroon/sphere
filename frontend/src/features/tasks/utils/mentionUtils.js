const MENTION_TOKEN_REGEX = /@\[([^\]]+)\]\(([a-f\d]{24})\)/gi;
const MENTION_QUERY_REGEX = /@([\w\s.-]*)$/;

export function buildMentionToken(member) {
  return `@[${member.name}](${member.id})`;
}

export function parseCommentBody(body) {
  if (!body) {
    return [];
  }

  const parts = [];
  const regex = new RegExp(MENTION_TOKEN_REGEX);
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    parts.push({ type: "mention", name: match[1], userId: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts;
}

export function getMentionQuery(text, cursor) {
  const textBefore = text.slice(0, cursor);
  const match = textBefore.match(MENTION_QUERY_REGEX);
  if (!match) {
    return null;
  }

  return {
    start: cursor - match[0].length,
    query: match[1].trimStart(),
  };
}

export function filterMentionCandidates(members, query, currentUserId) {
  const normalized = query.trim().toLowerCase();

  return (members ?? [])
    .filter((member) => member.id !== currentUserId)
    .filter((member) => {
      if (!normalized) {
        return true;
      }

      const name = member.name?.toLowerCase() ?? "";
      const email = member.email?.toLowerCase() ?? "";
      return name.includes(normalized) || email.includes(normalized);
    })
    .slice(0, 8);
}

export function insertMention({ value, mentionQuery, cursor, member }) {
  const token = `${buildMentionToken(member)} `;
  const nextValue =
    value.slice(0, mentionQuery.start) + token + value.slice(cursor);
  const nextCursor = mentionQuery.start + token.length;

  return { value: nextValue, cursor: nextCursor };
}
