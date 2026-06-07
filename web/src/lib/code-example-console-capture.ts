export const CODE_EXAMPLE_CONSOLE_MESSAGE_TYPE = "code-example-console";

export type ConsoleLogLevel = "log" | "warn" | "error" | "info" | "debug";

export type ConsoleLogEntry = {
  id: string;
  level: ConsoleLogLevel;
  messages: string[];
  timestamp: number;
};

export function createConsoleLogEntry(
  level: ConsoleLogLevel,
  messages: string[],
  index: number
): ConsoleLogEntry {
  return {
    id: `${Date.now()}-${index}`,
    level,
    messages,
    timestamp: Date.now(),
  };
}

function buildCaptureScript(sessionId: string): string {
  return `<script>
(function () {
  var TYPE = ${JSON.stringify(CODE_EXAMPLE_CONSOLE_MESSAGE_TYPE)};
  var SESSION = ${JSON.stringify(sessionId)};
  function formatArg(a) {
    if (a === undefined) return "undefined";
    if (a === null) return "null";
    if (typeof a === "object") {
      try { return JSON.stringify(a, null, 2); }
      catch (e) { return String(a); }
    }
    return String(a);
  }
  function post(level, args) {
    try {
      parent.postMessage({
        type: TYPE,
        sessionId: SESSION,
        level: level,
        messages: Array.prototype.map.call(args, formatArg),
      }, "*");
    } catch (e) {}
  }
  ["log", "warn", "error", "info", "debug"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      original.apply(console, arguments);
      post(level, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    post("error", [event.message || "Unknown error"]);
  });
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message =
      reason && typeof reason === "object" && "message" in reason
        ? String(reason.message)
        : String(reason);
    post("error", ["Unhandled promise rejection: " + message]);
  });
})();
</script>`;
}

export function injectConsoleCapture(
  html: string,
  baseHref: string,
  sessionId: string
): string {
  const captureScript = buildCaptureScript(sessionId);
  let result = html;

  if (!/<base[\s>]/i.test(result)) {
    if (/<head[\s>]/i.test(result)) {
      result = result.replace(
        /<head(\s[^>]*)?>/i,
        `$&<base href="${baseHref}">`
      );
    }
  }

  if (/<head[\s>]/i.test(result)) {
    result = result.replace(/<head(\s[^>]*)?>/i, `$&${captureScript}`);
    return result;
  }

  if (/<html[\s>]/i.test(result)) {
    return result.replace(
      /<html(\s[^>]*)?>/i,
      `$&<head><base href="${baseHref}">${captureScript}</head>`
    );
  }

  return `<!DOCTYPE html><html><head><base href="${baseHref}">${captureScript}</head><body>${result}</body></html>`;
}

export function previewBaseHref(previewUrl: string): string {
  return new URL(previewUrl, window.location.origin).href.replace(/[^/]+$/, "");
}
