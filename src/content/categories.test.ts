import { describe, expect, it } from "vitest";

import { CATEGORIES, categoryOfTrack } from "./categories";
import { TRACKS } from "./config";

describe("categories", () => {
  it("puts every configured track in exactly one category", () => {
    for (const track of Object.keys(TRACKS)) {
      expect(CATEGORIES.filter((c) => c.tracks.includes(track)), track).toHaveLength(1);
    }
    expect(categoryOfTrack("B1")?.id).toBe("backend");
  });
});
