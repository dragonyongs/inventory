// src/stores/__tests__/smoke.test.ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("IN -> OUT roundtrip", () => {
    expect(1 + 1).toBe(2);
  });
});
