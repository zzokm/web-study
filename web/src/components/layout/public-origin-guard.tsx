"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { markBuildUpdatePending } from "@/lib/build-update-reload";
import {
  canonicalPublicUrl,
  hasInternalPortOnPublicHost,
  reloadOnCleanOrigin,
  sanitizePublicUrl,
  shouldRedirectFromContainerPort,
} from "@/lib/public-origin";

const BUILD_ID_PATH = "/build-id.txt";
const CHUNK_ERROR_RE =
  /ChunkLoadError|Loading chunk \d+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i;

function redirectIfContainerPort(): void {
  if (!shouldRedirectFromContainerPort()) return;
  const target = sanitizePublicUrl(canonicalPublicUrl());
  if (target !== window.location.href) {
    window.location.replace(target);
  }
}

function isChunkLoadFailure(message: string): boolean {
  return CHUNK_ERROR_RE.test(message);
}

/** Runs before React so the first paint never stays on :3000/:7821. */
export function PublicOriginInlineScript() {
  return (
    // Must run before hydration on public hosts; App Router has no pages/_document.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- origin guard
    <Script id="public-origin-inline" strategy="beforeInteractive">
      {`(function(){var p=location.port,h=location.hostname,b=p==="3000"||p==="7821",l=h==="localhost"||h==="127.0.0.1"||h==="[::1]";function clean(u){try{var x=new URL(u,location.href);if((x.port==="3000"||x.port==="7821")&&x.hostname!=="localhost"&&x.hostname!=="127.0.0.1"){x.port="";return x.toString()}return u}catch(e){return u}}if(b&&!l){location.replace(location.protocol+"//"+h+location.pathname+location.search+location.hash)}document.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest)return;var a=t.closest("a[href]");if(!a||a.target&&a.target!=="_self"||a.hasAttribute("download"))return;var href=a.getAttribute("href");if(!href||href[0]==="#"||href.indexOf("mailto:")===0||href.indexOf("tel:")===0)return;try{var u=new URL(a.href);if((u.port==="3000"||u.port==="7821")&&u.hostname!=="localhost"&&u.hostname!=="127.0.0.1"){e.preventDefault();e.stopPropagation();location.assign(clean(a.href))}}catch(err){}},true);})();`}
    </Script>
  );
}

export function PublicOriginGuard() {
  const pathname = usePathname();
  const buildIdRef = useRef<string | null>(null);

  useEffect(() => {
    redirectIfContainerPort();
  }, [pathname]);

  useEffect(() => {
    async function syncBuildId() {
      try {
        const res = await fetch(BUILD_ID_PATH, { cache: "no-store" });
        if (!res.ok) return;
        const remote = (await res.text()).trim();
        if (!remote) return;
        if (buildIdRef.current === null) {
          buildIdRef.current = remote;
          return;
        }
        if (buildIdRef.current !== remote) {
          buildIdRef.current = remote;
          markBuildUpdatePending();
        }
      } catch {
        // ignore network errors
      }
    }

    void syncBuildId();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void syncBuildId();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      try {
        const resolved = new URL(anchor.href);
        if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
          return;
        }
        if (!hasInternalPortOnPublicHost(resolved.hostname, resolved.port)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        window.location.assign(sanitizePublicUrl(anchor.href));
      } catch {
        // ignore malformed URLs
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const { pushState, replaceState } = history;

    history.pushState = function pushStatePatched(state, unused, url) {
      const nextUrl =
        url == null ? url : sanitizePublicUrl(String(url), window.location.href);
      return pushState.call(history, state, unused, nextUrl);
    };

    history.replaceState = function replaceStatePatched(state, unused, url) {
      const nextUrl =
        url == null ? url : sanitizePublicUrl(String(url), window.location.href);
      return replaceState.call(history, state, unused, nextUrl);
    };

    return () => {
      history.pushState = pushState;
      history.replaceState = replaceState;
    };
  }, []);

  useEffect(() => {
    function onError(event: ErrorEvent) {
      const message = event.message ?? "";
      if (!isChunkLoadFailure(message)) return;
      reloadOnCleanOrigin();
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = String(event.reason ?? "");
      if (!isChunkLoadFailure(reason)) return;
      reloadOnCleanOrigin();
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
