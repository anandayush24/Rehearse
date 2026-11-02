import { describe, expect, it } from "vitest";

import { emptyProgress, parseExport, sanitize, serializeExport } from "./state";

describe("sanitize", () => {
  it("passes valid progress through", () => {
    const p = emptyProgress();
    p.questions["A1-Q001"] = { done: true };
    expect(sanitize(p)).toEqual(p);
  });

  it("falls back to defaults for garbage", () => {
    expect(sanitize("nope")).toEqual(emptyProgress());
    expect(sanitize(null)).toEqual(emptyProgress());
    expect(sanitize({ questions: 5 })).toEqual(emptyProgress());
  });

  it("keeps question state when only the review log is corrupt", () => {
    const p = emptyProgress();
    p.questions["A1-Q001"] = { saved: true };
    const out = sanitize({ ...p, reviews: [{ id: 1 }] });
    expect(out.questions["A1-Q001"]).toEqual({ saved: true });
    expect(out.reviews).toEqual([]);
  });
});

describe("export / import", () => {
  it("round-trips", () => {
    const p = emptyProgress();
    p.questions["A1-Q007"] = { done: true, note: "revisit generics" };
    expect(parseExport(serializeExport(p))).toEqual(p);
  });

  it("rejects non-JSON, foreign JSON and newer versions", () => {
    expect(() => parseExport("{")).toThrow(/not valid JSON/);
    expect(() => parseExport("{}")).toThrow(/not a Rehearse export/);
    const newer = JSON.parse(serializeExport(emptyProgress()));
    newer.version = 99;
    expect(() => parseExport(JSON.stringify(newer))).toThrow(/newer version/);
  });
});
