/** Keep in sync with src/lib/stem-match.ts */

export const CONTENT_MATCH_WEIGHTS = { stem: 0.55, options: 0.45 };
export const CONTENT_MATCH_THRESHOLD = 0.85;
export const ANSWER_MATCH_THRESHOLD = 0.95;
export const MATCH_THRESHOLD = CONTENT_MATCH_THRESHOLD;

/** @deprecated Use MATCH_THRESHOLD — kept for callers that referenced the old constant */
export const FUZZY_STEM_RATIO = MATCH_THRESHOLD;

/** Remove leading exam question numbers (e.g. "45.", "36)"). */
export function stripQuestionNumber(text) {
  return text.replace(/^\s*\d+\s*[.)]\s*/, "").trim();
}

export function normQuestionText(text) {
  return stripQuestionNumber(text)
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

export function normalizedOptionSet(question) {
  return question.options
    .map((o) => normQuestionText(o.content))
    .filter(Boolean)
    .sort();
}

export function tokenJaccard(a, b) {
  const tokensA = new Set(a.split(/\s+/).filter(Boolean));
  const tokensB = new Set(b.split(/\s+/).filter(Boolean));
  if (!tokensA.size && !tokensB.size) return 1;
  if (!tokensA.size || !tokensB.size) return 0;
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union ? intersection / union : 0;
}

export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

export function levenshteinRatio(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

export function textSimilarity(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;

  let containment = 0;
  if (longer.includes(shorter)) {
    containment = shorter.length / maxLen;
  }

  return Math.max(
    tokenJaccard(a, b),
    levenshteinRatio(a, b),
    containment
  );
}

export function optionsSimilarity(questionA, questionB) {
  const optsA = normalizedOptionSet(questionA);
  const optsB = normalizedOptionSet(questionB);
  if (!optsA.length && !optsB.length) return 1;
  if (!optsA.length || !optsB.length) return 0;

  const used = new Set();
  let total = 0;

  for (const optionA of optsA) {
    let best = 0;
    let bestIndex = -1;
    for (let j = 0; j < optsB.length; j++) {
      if (used.has(j)) continue;
      const score = textSimilarity(optionA, optsB[j]);
      if (score > best) {
        best = score;
        bestIndex = j;
      }
    }
    if (bestIndex >= 0 && best >= 0.75) {
      used.add(bestIndex);
      total += best;
    }
  }

  return total / Math.max(optsA.length, optsB.length);
}

export function answerMatchScore(questionA, questionB) {
  return textSimilarity(
    normCorrectAnswerContent(questionA),
    normCorrectAnswerContent(questionB)
  );
}

export function contentMatchScore(questionA, questionB) {
  const stemSim = textSimilarity(
    normQuestionText(questionA.questionText),
    normQuestionText(questionB.questionText)
  );
  const optionsSim = optionsSimilarity(questionA, questionB);
  return (
    CONTENT_MATCH_WEIGHTS.stem * stemSim +
    CONTENT_MATCH_WEIGHTS.options * optionsSim
  );
}

/** Weighted score for investigation output (answer required separately). */
export function questionMatchScore(questionA, questionB) {
  const answerSim = answerMatchScore(questionA, questionB);
  const contentSim = contentMatchScore(questionA, questionB);
  return 0.55 * contentSim + 0.45 * answerSim;
}

export function questionsEquivalent(questionA, questionB) {
  if (answerMatchScore(questionA, questionB) < ANSWER_MATCH_THRESHOLD) {
    return false;
  }
  return contentMatchScore(questionA, questionB) >= CONTENT_MATCH_THRESHOLD;
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

function splitRepetitionKey(key) {
  const idx = key.lastIndexOf("|");
  if (idx <= 0) return [key, ""];
  return [key.slice(0, idx), key.slice(idx + 1)];
}

function unionFindGroups(items, equivalent) {
  const parent = items.map((_, index) => index);

  function find(index) {
    let root = index;
    while (parent[root] !== root) {
      parent[root] = parent[parent[root]];
      root = parent[root];
    }
    return root;
  }

  function union(left, right) {
    const rootLeft = find(left);
    const rootRight = find(right);
    if (rootLeft !== rootRight) parent[rootLeft] = rootRight;
  }

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (equivalent(items[i], items[j])) union(i, j);
    }
  }

  const groups = new Map();
  for (let i = 0; i < items.length; i++) {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(items[i]);
    groups.set(root, list);
  }

  return [...groups.values()];
}

export function groupByRepetitionKey(questions) {
  return groupByRepetitionKeyForPool(questions.filter(isRepetitionEligible));
}

function groupByRepetitionKeyForPool(questions) {
  const groups = unionFindGroups(questions, questionsEquivalent);
  return groups.filter((group) => group.length >= 2);
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

/** @deprecated Use textSimilarity */
export function stemSimilarity(a, b) {
  return textSimilarity(a, b);
}

/** Cluster by equivalent stem + answer (exact or fuzzy). */
export function clusterByRepetitionKey(questions) {
  const written = questions.filter((q) => q.questionType === "written");
  const pool = questions.filter((q) => q.questionType !== "written");
  const clusters = unionFindGroups(pool, questionsEquivalent);
  return [...clusters, ...written.map((q) => [q])];
}
