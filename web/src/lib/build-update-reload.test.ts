import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  markBuildUpdatePending,
  notifyBuildReloadSafeMoment,
  registerBuildReloadGate,
  unregisterBuildReloadGate,
} from "@/lib/build-update-reload";

const reloadSpy = vi.fn();

vi.mock("@/lib/public-origin", () => ({
  reloadOnCleanOrigin: (...args: unknown[]) => reloadSpy(...args),
}));

describe("build-update-reload", () => {
  beforeEach(() => {
    reloadSpy.mockClear();
  });

  afterEach(() => {
    unregisterBuildReloadGate("test-gate");
  });

  it("reloads immediately when no practice gate is registered", () => {
    markBuildUpdatePending();
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("defers reload until the gate clears and a safe moment is reached", () => {
    registerBuildReloadGate("test-gate");
    markBuildUpdatePending();
    expect(reloadSpy).not.toHaveBeenCalled();

    unregisterBuildReloadGate("test-gate");
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("reloads on a safe moment even while a practice gate is active", () => {
    registerBuildReloadGate("test-gate");
    markBuildUpdatePending();
    expect(reloadSpy).not.toHaveBeenCalled();

    notifyBuildReloadSafeMoment();
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
