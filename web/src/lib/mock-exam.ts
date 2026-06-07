import {
  preparePracticeQuestions,
  type PracticeSessionConfig,
} from "@/lib/practice-session-config";
import {
  createSeededRandom,
  randomUint32,
  seededFisherYates,
} from "@/lib/seeded-random";
import {
  getAllQuestions,
  getExamYears,
  getLectureSlugs,
  getQuestionsByExamYear,
  getQuestionsByLectureSlug,
} from "@/lib/questions";
import type { Question } from "@/types/question";

export const MOCK_EXAM_GENERATOR_VERSION = 1;

export type MockExamSpec = {
  version: typeof MOCK_EXAM_GENERATOR_VERSION;
  seed: number;
  questionCount: number;
  frontendShare: number;
  backendShare: number;
  config: PracticeSessionConfig;
};

export const DEFAULT_MOCK_PRACTICE_CONFIG: PracticeSessionConfig = {
  shuffleQuestions: true,
  shuffleMcqOptions: true,
  showSessionTimer: true,
  examSimulation: true,
};

export const DEFAULT_MOCK_QUESTION_COUNT = 84;
export const MOCK_EXAM_MIN_QUESTION_COUNT = 20;
export const MOCK_EXAM_MAX_QUESTION_COUNT = 120;
export const DEFAULT_MOCK_FRONTEND_SHARE = 70;
/** Unset seed placeholder for SSR only — never persisted or shown to users. */
export const MOCK_EXAM_PLACEHOLDER_SEED = 0;
export const MOCK_EXAM_SEED_MIN = 1;
export const MOCK_EXAM_SEED_MAX = 4294967295;

/** Stable defaults for SSR — avoids hydration mismatch. */
export function createDefaultMockExamSpec(
  overrides?: Partial<MockExamSpec>
): MockExamSpec {
  return {
    version: MOCK_EXAM_GENERATOR_VERSION,
    seed: MOCK_EXAM_PLACEHOLDER_SEED,
    questionCount: DEFAULT_MOCK_QUESTION_COUNT,
    frontendShare: DEFAULT_MOCK_FRONTEND_SHARE,
    backendShare: 100 - DEFAULT_MOCK_FRONTEND_SHARE,
    config: { ...DEFAULT_MOCK_PRACTICE_CONFIG },
    ...overrides,
  };
}

export function parseMockExamSeed(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (
    !Number.isSafeInteger(n) ||
    n < MOCK_EXAM_SEED_MIN ||
    n > MOCK_EXAM_SEED_MAX
  ) {
    return null;
  }
  return n >>> 0;
}

/** Client-only fresh spec with a random seed. */
export function createFreshMockExamSpec(
  overrides?: Partial<MockExamSpec>
): MockExamSpec {
  return normalizeMockExamSpec(
    createDefaultMockExamSpec({ seed: randomUint32(), ...overrides })
  );
}

function mockExamConfigMatches(
  a: PracticeSessionConfig,
  b: PracticeSessionConfig
): boolean {
  return (
    a.shuffleQuestions === b.shuffleQuestions &&
    a.shuffleMcqOptions === b.shuffleMcqOptions &&
    a.showSessionTimer === b.showSessionTimer &&
    a.examSimulation === b.examSimulation
  );
}

/** True when the spec still carries an SSR/default seed, not a user-chosen one. */
export function isPlaceholderMockExamSpec(spec: MockExamSpec): boolean {
  if (spec.seed === MOCK_EXAM_PLACEHOLDER_SEED) return true;
  if (spec.seed !== 1) return false;
  const defaults = createDefaultMockExamSpec({ seed: 1 });
  return (
    spec.questionCount === defaults.questionCount &&
    spec.frontendShare === defaults.frontendShare &&
    spec.backendShare === defaults.backendShare &&
    mockExamConfigMatches(spec.config, defaults.config)
  );
}

/** Hydrate mock exam spec from storage, randomizing placeholder seeds. */
export function resolveMockExamSpecOnLoad(
  saved: MockExamSpec | null
): MockExamSpec {
  if (!saved) return createFreshMockExamSpec();
  const normalized = normalizeMockExamSpec(saved);
  if (!isPlaceholderMockExamSpec(normalized)) return normalized;
  return createFreshMockExamSpec({
    questionCount: normalized.questionCount,
    frontendShare: normalized.frontendShare,
    backendShare: normalized.backendShare,
    config: normalized.config,
  });
}

export function getMockExamAllocationPreview(
  spec: MockExamSpec
): MockExamLectureAllocationRow[] {
  const normalized = normalizeMockExamSpec(spec);
  const historical = buildHistoricalLectureShares();
  const weights = scaledLectureWeights(
    historical,
    normalized.frontendShare,
    normalized.backendShare
  );

  const lectures = getLectureSlugs();
  const pools: Record<string, Question[]> = {};
  for (const lec of lectures) {
    if ((weights[lec.slug] ?? 0) <= 0) continue;
    pools[lec.slug] = getQuestionsByLectureSlug(lec.slug);
  }

  let allocation = allocateLargestRemainder(weights, normalized.questionCount);
  allocation = rebalanceAllocation(allocation, pools);

  return lectures
    .map((lec) => {
      const weight = weights[lec.slug] ?? 0;
      const questions = allocation[lec.slug] ?? 0;
      if (weight <= 0 && questions <= 0) return null;
      return {
        slug: lec.slug,
        lecture: lec.lecture,
        track: lec.track,
        trackLabel: lec.trackLabel,
        historicalSharePercent:
          Math.round((historical[lec.slug] ?? 0) * 1000) / 10,
        targetSharePercent: Math.round(weight * 1000) / 10,
        targetQuestions: questions,
      };
    })
    .filter((row): row is MockExamLectureAllocationRow => row != null)
    .sort((a, b) => b.targetSharePercent - a.targetSharePercent);
}

/** Average per-year lecture share across historical finals. */
export function buildHistoricalLectureShares(): Record<string, number> {
  const years = getExamYears();
  const sums: Record<string, number> = {};

  for (const year of years) {
    const questions = getQuestionsByExamYear(year);
    const total = questions.length || 1;
    const yearCounts: Record<string, number> = {};

    for (const q of questions) {
      const topics = q.relatedTopics?.filter(Boolean) ?? [];
      if (topics.length === 0) continue;
      for (const slug of topics) {
        yearCounts[slug] = (yearCounts[slug] ?? 0) + 1;
      }
    }

    for (const [slug, count] of Object.entries(yearCounts)) {
      sums[slug] = (sums[slug] ?? 0) + count / total;
    }
  }

  const divisor = years.length || 1;
  const avg: Record<string, number> = {};
  for (const [slug, sum] of Object.entries(sums)) {
    avg[slug] = sum / divisor;
  }
  return avg;
}

export type MockExamLectureAllocationRow = {
  slug: string;
  lecture: string;
  track: string;
  trackLabel: string;
  /** Average share of each final exam (across years). */
  historicalSharePercent: number;
  /** Share of this mock exam after FE/BE scaling. */
  targetSharePercent: number;
  targetQuestions: number;
};

export function scaledLectureWeights(
  historical: Record<string, number>,
  frontendShare: number,
  backendShare: number
): Record<string, number> {
  const lectures = getLectureSlugs();
  const fe = lectures.filter((l) => l.track === "frontend");
  const be = lectures.filter((l) => l.track === "backend");

  const feSum = fe.reduce((s, l) => s + (historical[l.slug] ?? 0), 0);
  const beSum = be.reduce((s, l) => s + (historical[l.slug] ?? 0), 0);

  const weights: Record<string, number> = {};
  for (const l of fe) {
    const h = historical[l.slug] ?? 0;
    weights[l.slug] =
      feSum > 0 ? (h / feSum) * (frontendShare / 100) : fe.length > 0 ? frontendShare / 100 / fe.length : 0;
  }
  for (const l of be) {
    const h = historical[l.slug] ?? 0;
    weights[l.slug] =
      beSum > 0 ? (h / beSum) * (backendShare / 100) : be.length > 0 ? backendShare / 100 / be.length : 0;
  }
  return weights;
}

function allocateLargestRemainder(
  weights: Record<string, number>,
  total: number
): Record<string, number> {
  const slugs = Object.keys(weights).filter((s) => weights[s] > 0);
  const sum = slugs.reduce((s, slug) => s + weights[slug], 0);
  if (sum === 0 || total <= 0) return {};

  const parts = slugs.map((slug) => {
    const exact = (weights[slug] / sum) * total;
    const floor = Math.floor(exact);
    return { slug, count: floor, remainder: exact - floor };
  });

  let assigned = parts.reduce((s, p) => s + p.count, 0);
  const sorted = [...parts].sort((a, b) => b.remainder - a.remainder);
  const result: Record<string, number> = {};
  for (const p of parts) result[p.slug] = p.count;

  for (let i = 0; assigned < total && i < sorted.length; i++) {
    result[sorted[i].slug]++;
    assigned++;
  }

  return result;
}

function rebalanceAllocation(
  allocation: Record<string, number>,
  pools: Record<string, Question[]>
): Record<string, number> {
  const result = { ...allocation };
  const lectures = getLectureSlugs();
  const byTrack = {
    frontend: lectures.filter((l) => l.track === "frontend").map((l) => l.slug),
    backend: lectures.filter((l) => l.track === "backend").map((l) => l.slug),
  };

  function spare(slug: string): number {
    return (pools[slug]?.length ?? 0) - (result[slug] ?? 0);
  }

  function redistributeTrack(trackSlugs: string[]) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const slug of trackSlugs) {
        const poolSize = pools[slug]?.length ?? 0;
        const need = (result[slug] ?? 0) - poolSize;
        if (need <= 0) continue;
        result[slug] = poolSize;
        let deficit = need;
        const donors = trackSlugs
          .filter((s) => s !== slug && spare(s) > 0)
          .sort((a, b) => spare(b) - spare(a));
        for (const donor of donors) {
          if (deficit <= 0) break;
          const give = Math.min(spare(donor), deficit);
          result[donor] = (result[donor] ?? 0) + give;
          deficit -= give;
          changed = true;
        }
        if (deficit > 0) {
          const anyDonors = Object.keys(pools)
            .filter((s) => !trackSlugs.includes(s) && spare(s) > 0)
            .sort((a, b) => spare(b) - spare(a));
          for (const donor of anyDonors) {
            if (deficit <= 0) break;
            const give = Math.min(spare(donor), deficit);
            result[donor] = (result[donor] ?? 0) + give;
            deficit -= give;
            changed = true;
          }
        }
      }
    }
  }

  redistributeTrack(byTrack.frontend);
  redistributeTrack(byTrack.backend);
  return result;
}

export function getMockExamMaxQuestionCount(): number {
  const seen = new Set<string>();
  for (const q of getAllQuestions()) {
    if (q.relatedTopics?.length) seen.add(q.questionKey);
  }
  return Math.min(seen.size, MOCK_EXAM_MAX_QUESTION_COUNT);
}

export function clampMockQuestionCount(count: number): number {
  return Math.max(
    MOCK_EXAM_MIN_QUESTION_COUNT,
    Math.min(count, getMockExamMaxQuestionCount())
  );
}

export function resolveMockQuestionCountInput(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return MOCK_EXAM_MIN_QUESTION_COUNT;
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n) || n <= 0) return MOCK_EXAM_MIN_QUESTION_COUNT;
  if (n > MOCK_EXAM_MAX_QUESTION_COUNT) return getMockExamMaxQuestionCount();
  return clampMockQuestionCount(n);
}

export function normalizeMockExamConfig(
  config: PracticeSessionConfig
): PracticeSessionConfig {
  return {
    ...config,
    shuffleQuestions: true,
    shuffleMcqOptions: true,
  };
}

export function normalizeMockExamSpec(spec: MockExamSpec): MockExamSpec {
  const frontendShare = Math.max(0, Math.min(100, Math.round(spec.frontendShare)));
  return {
    ...spec,
    version: MOCK_EXAM_GENERATOR_VERSION,
    questionCount: clampMockQuestionCount(spec.questionCount),
    frontendShare,
    backendShare: 100 - frontendShare,
    config: normalizeMockExamConfig(spec.config),
  };
}

export function generateMockExam(spec: MockExamSpec): {
  questions: Question[];
  spec: MockExamSpec;
} {
  const normalized = normalizeMockExamSpec(spec);
  const random = createSeededRandom(normalized.seed);
  const historical = buildHistoricalLectureShares();
  const weights = scaledLectureWeights(
    historical,
    normalized.frontendShare,
    normalized.backendShare
  );

  const lectures = getLectureSlugs();
  const pools: Record<string, Question[]> = {};
  for (const lec of lectures) {
    if ((weights[lec.slug] ?? 0) <= 0) continue;
    pools[lec.slug] = getQuestionsByLectureSlug(lec.slug);
  }

  let allocation = allocateLargestRemainder(weights, normalized.questionCount);
  allocation = rebalanceAllocation(allocation, pools);

  const selectedKeys = new Set<string>();
  const selected: Question[] = [];

  const slugOrder = Object.keys(allocation).sort();
  for (const slug of slugOrder) {
    const count = allocation[slug] ?? 0;
    if (count <= 0) continue;
    const pool = pools[slug] ?? [];
    const shuffled = seededFisherYates(pool, random);
    let taken = 0;
    for (const q of shuffled) {
      if (taken >= count) break;
      if (selectedKeys.has(q.questionKey)) continue;
      selectedKeys.add(q.questionKey);
      selected.push(q);
      taken++;
    }
  }

  if (selected.length < normalized.questionCount) {
    const allPool: Question[] = [];
    for (const slug of Object.keys(pools).sort()) {
      for (const q of pools[slug]) {
        if (!selectedKeys.has(q.questionKey)) allPool.push(q);
      }
    }
    const extra = seededFisherYates(allPool, random);
    for (const q of extra) {
      if (selected.length >= normalized.questionCount) break;
      if (selectedKeys.has(q.questionKey)) continue;
      selectedKeys.add(q.questionKey);
      selected.push(q);
    }
  }

  const ordered = seededFisherYates(selected, random);
  const prepared = preparePracticeQuestions(
    ordered,
    normalized.config,
    random
  );

  return { questions: prepared, spec: normalized };
}

export function mockExamTitle(questionCount: number): string {
  return `Mock exam · ${questionCount} questions`;
}
