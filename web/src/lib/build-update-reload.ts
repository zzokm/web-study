"use client";

import { reloadOnCleanOrigin } from "@/lib/public-origin";

let pendingBuildReload = false;
const reloadGates = new Set<string>();

/** A new deployment was detected; reload when no practice gates are active. */
export function markBuildUpdatePending(): void {
  pendingBuildReload = true;
  tryFlushBuildReload();
}

export function hasPendingBuildReload(): boolean {
  return pendingBuildReload;
}

/** Block auto-reload while the user is mid-practice (e.g. before Check answer). */
export function registerBuildReloadGate(id: string): void {
  reloadGates.add(id);
}

export function unregisterBuildReloadGate(id: string): void {
  reloadGates.delete(id);
  tryFlushBuildReload();
}

/** Call after a safe checkpoint (Check answer, Finish) to apply a queued reload. */
export function notifyBuildReloadSafeMoment(): void {
  if (!pendingBuildReload) return;
  pendingBuildReload = false;
  reloadOnCleanOrigin();
}

function tryFlushBuildReload(): void {
  if (!pendingBuildReload || reloadGates.size > 0) return;
  pendingBuildReload = false;
  reloadOnCleanOrigin();
}
