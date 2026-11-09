import { afterEach, describe, expect, it, vi } from "vitest";
import { createId } from "./id";

describe("createId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("1000개가 모두 다르다", () => {
    expect(new Set(Array.from({ length: 1000 }, createId)).size).toBe(1000);
  });

  it("randomUUID가 없어도 동작한다", () => {
    vi.stubGlobal("crypto", {});
    const ids = Array.from({ length: 1000 }, createId);
    expect(new Set(ids).size).toBe(1000);
    expect(ids[0]).toMatch(/^[0-9a-z-]+$/);
  });
});
