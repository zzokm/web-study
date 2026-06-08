import { describe, expect, it } from "vitest";
import { buildExamAnalysis, buildTrackAllocation } from "@/lib/exam-analysis";

describe("buildTrackAllocation", () => {
  it("returns all, year average, and per-year rows", () => {
    const rows = buildTrackAllocation(["2021", "2024", "2025"]);
    expect(rows.map((r) => r.key)).toEqual([
      "all",
      "average",
      "2021",
      "2024",
      "2025",
    ]);
  });

  it("frontend and backend shares sum to 100 when hits exist", () => {
    const rows = buildTrackAllocation(["2021", "2024", "2025"]);
    for (const row of rows) {
      if (row.frontendHits + row.backendHits === 0) continue;
      expect(row.frontendShare + row.backendShare).toBe(100);
      expect(row.frontendShare).toBeGreaterThan(0);
      expect(row.backendShare).toBeGreaterThan(0);
    }
  });

  it("year average is the mean of per-year frontend shares", () => {
    const rows = buildTrackAllocation(["2021", "2024", "2025"]);
    const yearRows = rows.filter((r) =>
      ["2021", "2024", "2025"].includes(r.key)
    );
    const average = rows.find((r) => r.key === "average");
    const expected =
      Math.round(
        (yearRows.reduce((sum, row) => sum + row.frontendShare, 0) /
          yearRows.length) *
          10
      ) / 10;
    expect(average?.frontendShare).toBe(expected);
  });
});

describe("buildExamAnalysis", () => {
  it("includes track allocation metrics", () => {
    const data = buildExamAnalysis();
    expect(data.trackAllocation.length).toBeGreaterThanOrEqual(5);
    expect(data.trackAllocation[0]?.key).toBe("all");
    expect(data.trackAllocation[1]?.key).toBe("average");
  });
});
