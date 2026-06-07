/** Keep in sync with src/lib/stem-match.ts */

export const FUZZY_STEM_RATIO = 0.97;

export function normQuestionText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normCorrectAnswerContent(question) {
  const correctId = question.correctAnswerId.trim().toLowerCase();
  const option = question.options.find(
    (o) => o.id.trim().toLowerCase() === correctId
  );
  return normQuestionText(option?.content ?? correctId);
}

export function repetitionKey(question) {
  const stem = normQuestionText(question.questionText);
  if (!stem) return "";
  return `${stem}|${normCorrectAnswerContent(question)}`;
}

function stemSimilarity(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;
  if (longer.includes(shorter) && shorter.length / longer.length >= FUZZY_STEM_RATIO) {
    return FUZZY_STEM_RATIO;
  }
  let matches = 0;
  const limit = Math.min(a.length, b.length);
  for (let i = 0; i < limit; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

function splitRepetitionKey(key) {
  const idx = key.lastIndexOf("|");
  if (idx <= 0) return [key, ""];
  return [key.slice(0, idx), key.slice(idx + 1)];
}

export function groupByRepetitionKey(questions) {
  const buckets = new Map();
  for (const q of questions) {
    const key = repetitionKey(q);
    if (!key) continue;
    const list = buckets.get(key) ?? [];
    list.push(q);
    buckets.set(key, list);
  }

  const keys = [...buckets.keys()];
  const used = new Set();
  const groups = [];

  for (let i = 0; i < keys.length; i++) {
    const keyI = keys[i];
    if (used.has(keyI)) continue;
    const [stemI, answerI] = splitRepetitionKey(keyI);
    const group = [...(buckets.get(keyI) ?? [])];
    used.add(keyI);

    for (let j = i + 1; j < keys.length; j++) {
      const keyJ = keys[j];
      if (used.has(keyJ)) continue;
      const [stemJ, answerJ] = splitRepetitionKey(keyJ);
      if (answerI !== answerJ) continue;
      if (stemI === stemJ || stemSimilarity(stemI, stemJ) >= FUZZY_STEM_RATIO) {
        group.push(...(buckets.get(keyJ) ?? []));
        used.add(keyJ);
      }
    }

    if (group.length >= 2) groups.push(group);
  }

  return groups;
}

function appearanceKey(origin, sourceQuestionId) {
  return `${origin}:${sourceQuestionId}`;
}

export function mergeRepetitiveGroup(group) {
  if (group.length === 1) return group[0];

  const primary = group[0];
  const appearanceMap = new Map();

  for (const q of group) {
    const key = appearanceKey(q.origin, q.sourceQuestionId);
    if (!appearanceMap.has(key)) {
      appearanceMap.set(key, {
        origin: q.origin,
        sourceFile: q.sourceFile,
        sourceQuestionId: q.sourceQuestionId,
      });
    }
  }

  const origins = [...new Set(group.map((q) => q.origin))];

  return {
    ...primary,
    instanceCount: group.length,
    origins,
    appearances: [...appearanceMap.values()],
  };
}

export function buildRepetitiveCatalog(questions) {
  const groups = groupByRepetitionKey(questions)
    .map(mergeRepetitiveGroup)
    .sort((a, b) => {
      const diff = (b.instanceCount ?? 0) - (a.instanceCount ?? 0);
      if (diff !== 0) return diff;
      return (b.origins?.length ?? 0) - (a.origins?.length ?? 0);
    });

  return {
    questions: groups,
    uniqueRepeatedStems: groups.length,
    repetitiveKeys: groups.map((q) => q.questionKey),
  };
}
