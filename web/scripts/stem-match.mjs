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

const EXAM_YEARS = new Set(["2021", "2024", "2025"]);

export function isRepetitionEligible(question) {
  return question.questionType !== "written" && EXAM_YEARS.has(question.origin);
}

export function repetitionKey(question) {
  const stem = normQuestionText(question.questionText);
  if (!stem) return "";
  return `${stem}|${normCorrectAnswerContent(question)}`;
}

function stemSimilarity(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);
  if (minLen / maxLen < FUZZY_STEM_RATIO) return 0;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;
  if (longer.includes(shorter) && shorter.length / longer.length >= FUZZY_STEM_RATIO) {
    return FUZZY_STEM_RATIO;
  }
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / maxLen;
}

function stemsEquivalent(stemA, stemB) {
  return stemA === stemB || stemSimilarity(stemA, stemB) >= FUZZY_STEM_RATIO;
}

function splitRepetitionKey(key) {
  const idx = key.lastIndexOf("|");
  if (idx <= 0) return [key, ""];
  return [key.slice(0, idx), key.slice(idx + 1)];
}

function mergeFuzzyStemGroups(buckets, keys) {
  const used = new Set();
  const groups = [];

  for (let i = 0; i < keys.length; i++) {
    const keyI = keys[i];
    if (used.has(keyI)) continue;
    const [stemI] = splitRepetitionKey(keyI);
    const group = [...(buckets.get(keyI) ?? [])];
    used.add(keyI);

    for (let j = i + 1; j < keys.length; j++) {
      const keyJ = keys[j];
      if (used.has(keyJ)) continue;
      const [stemJ] = splitRepetitionKey(keyJ);
      if (stemsEquivalent(stemI, stemJ)) {
        group.push(...(buckets.get(keyJ) ?? []));
        used.add(keyJ);
      }
    }

    groups.push(group);
  }

  return groups;
}

export function groupByRepetitionKey(questions) {
  return groupByRepetitionKeyForPool(questions.filter(isRepetitionEligible));
}

function groupByRepetitionKeyForPool(questions) {
  const buckets = new Map();
  const keysByAnswer = new Map();

  for (const q of questions) {
    const key = repetitionKey(q);
    if (!key) continue;
    const list = buckets.get(key) ?? [];
    list.push(q);
    buckets.set(key, list);

    const [, answer] = splitRepetitionKey(key);
    const answerKeys = keysByAnswer.get(answer) ?? [];
    if (!answerKeys.includes(key)) answerKeys.push(key);
    keysByAnswer.set(answer, answerKeys);
  }

  const groups = [];
  for (const answerKeys of keysByAnswer.values()) {
    for (const group of mergeFuzzyStemGroups(buckets, answerKeys)) {
      if (group.length >= 2) groups.push(group);
    }
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
    if (!EXAM_YEARS.has(q.origin)) continue;
    const key = appearanceKey(q.origin, q.sourceQuestionId);
    if (!appearanceMap.has(key)) {
      appearanceMap.set(key, {
        origin: q.origin,
        sourceFile: q.sourceFile,
        sourceQuestionId: q.sourceQuestionId,
      });
    }
  }

  const examGroup = group.filter(isRepetitionEligible);
  const origins = [...new Set(examGroup.map((q) => q.origin))];

  const appearances = [...appearanceMap.values()].filter((a) =>
    EXAM_YEARS.has(a.origin)
  );

  return {
    ...primary,
    instanceCount: examGroup.length,
    origins,
    appearances,
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
