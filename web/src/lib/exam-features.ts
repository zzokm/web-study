/**
 * Exam-season UI toggles.
 *
 * The exam is over, so the sidebar countdown, the "Hope you did well on your
 * exam!" banner, and the confetti are all off. The code behind each one is
 * untouched — flip a flag back to true to bring that piece back for the next
 * exam season.
 */

/** The "Exam in / Exam ongoing / Exam finished" block at the top of the sidebar. */
export const EXAM_COUNTDOWN_ENABLED = false;

/** The post-exam banner above the page content, links and all. */
export const EXAM_POST_CELEBRATION_ENABLED = false;

/** The confetti burst that fires with the post-exam banner. */
export const EXAM_CONFETTI_ENABLED = false;