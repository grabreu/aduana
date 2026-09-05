import { describe, expect, it } from "vitest";
import { buildQuery, buildUrl, joinUrl } from "./url";

describe("joinUrl", () => {
  it("joins a base with a trailing slash and a path without a leading slash", () => {
    expect(joinUrl("https://api.com/", "users")).toBe("https://api.com/users");
  });

  it("joins a base without a trailing slash and a path with a leading slash", () => {
    expect(joinUrl("https://api.com", "/users")).toBe("https://api.com/users");
  });

  it("never duplicates the slash, no matter the combination", () => {
    expect(joinUrl("https://api.com/", "/users")).toBe("https://api.com/users");
    expect(joinUrl("https://api.com///", "///users")).toBe(
      "https://api.com/users",
    );
  });

  it("ignores baseURL when the path is already absolute", () => {
    expect(joinUrl("https://api.com", "https://other.com/x")).toBe(
      "https://other.com/x",
    );
  });

  it("works without a baseURL", () => {
    expect(joinUrl("", "users")).toBe("/users");
    expect(joinUrl("", "/users")).toBe("/users");
  });
});

describe("buildQuery", () => {
  it("ignores undefined and null", () => {
    expect(buildQuery({ a: 1, b: undefined, c: null })).toBe("a=1");
  });

  it("repeats the key for arrays (ASP.NET Core / FastAPI style)", () => {
    expect(buildQuery({ ids: [1, 2, 3] })).toBe("ids=1&ids=2&ids=3");
  });

  it("mixes a single value and an array", () => {
    expect(buildQuery({ active: true, ids: [1, 2] })).toBe(
      "active=true&ids=1&ids=2",
    );
  });

  it("returns an empty string without params", () => {
    expect(buildQuery(undefined)).toBe("");
    expect(buildQuery({})).toBe("");
  });
});

describe("buildUrl", () => {
  it("joins baseURL, path and query", () => {
    expect(buildUrl("/users", "https://api.com", { active: true })).toBe(
      "https://api.com/users?active=true",
    );
  });

  it("uses & when the url already has a query string", () => {
    expect(buildUrl("/users?sort=name", "https://api.com", { page: 2 })).toBe(
      "https://api.com/users?sort=name&page=2",
    );
  });

  it("does not add '?' without params", () => {
    expect(buildUrl("/users", "https://api.com")).toBe("https://api.com/users");
  });
});
