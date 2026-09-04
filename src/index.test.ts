import { describe, expect, it } from "vitest";

import { VERSION } from "./index.js";

describe("VERSION", () => {
  it("is exported", () => {
    expect(VERSION).toBeTypeOf("string");
  });
});
