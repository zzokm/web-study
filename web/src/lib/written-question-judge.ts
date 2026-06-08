import { injectConsoleCapture } from "@/lib/code-example-console-capture";
import { wrapHtmlIfNeeded } from "@/lib/written-html";
import {
  runWrittenRubricChecks,
  type WrittenJudgeResult,
} from "@/lib/written-question-checks";
import type { WrittenRubric } from "@/types/question";

const JUDGE_IFRAME_ID = "written-question-judge-frame";

function getOrCreateJudgeIframe(): HTMLIFrameElement {
  let iframe = document.getElementById(
    JUDGE_IFRAME_ID
  ) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = JUDGE_IFRAME_ID;
    iframe.setAttribute("aria-hidden", "true");
    iframe.sandbox = "allow-scripts allow-same-origin allow-modals";
    iframe.className =
      "pointer-events-none fixed -left-[9999px] top-0 h-96 w-full max-w-3xl opacity-0";
    document.body.appendChild(iframe);
  }
  return iframe;
}

function loadHtmlInIframe(
  iframe: HTMLIFrameElement,
  html: string,
  sessionId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const prepared = injectConsoleCapture(html, "", sessionId);
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      reject(new Error("Iframe document unavailable"));
      return;
    }

    try {
      doc.open();
      doc.write(prepared);
      doc.close();
      window.setTimeout(() => resolve(), 0);
    } catch (err) {
      reject(err);
    }
  });
}

export async function judgeWrittenHtml(
  source: string,
  rubric: WrittenRubric
): Promise<WrittenJudgeResult> {
  const iframe = getOrCreateJudgeIframe();
  const html = wrapHtmlIfNeeded(source);
  await loadHtmlInIframe(iframe, html, crypto.randomUUID());

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    return {
      passed: false,
      results: [
        {
          id: "runtime",
          passed: false,
          message: "Could not access iframe document",
        },
      ],
    };
  }

  return runWrittenRubricChecks(doc, win, rubric);
}

export { runWrittenRubricChecks };
export type { WrittenJudgeResult, WrittenCheckResult } from "@/lib/written-question-checks";
