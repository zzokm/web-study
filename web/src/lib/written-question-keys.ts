/** Hub catalog key for the 2025 Final written question (Q81). */
export const WRITTEN_EXAM_Q81_KEY = "written:wq-style-english-arabic";

export function isWrittenExamQ81(questionKey: string): boolean {
  return questionKey === WRITTEN_EXAM_Q81_KEY;
}
