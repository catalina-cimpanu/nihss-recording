import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatElapsedClock } from "@/lib/nihss/duration";

describe("formatElapsedClock", () => {
  it("formats zero and seconds under a minute as m:ss", () => {
    assert.equal(formatElapsedClock(0), "0:00");
    assert.equal(formatElapsedClock(1000), "0:01");
    assert.equal(formatElapsedClock(59_000), "0:59");
  });

  it("formats minutes past 59 without wrapping to hours", () => {
    assert.equal(formatElapsedClock(60_000), "1:00");
    assert.equal(formatElapsedClock(3_723_000), "62:03");
  });

  it("treats negative or invalid durations as 0:00", () => {
    assert.equal(formatElapsedClock(-500), "0:00");
    assert.equal(formatElapsedClock(Number.NaN), "0:00");
  });
});
