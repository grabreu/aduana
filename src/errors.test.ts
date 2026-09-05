import { describe, expect, it } from "vitest";
import {
  HttpError,
  isHttpError,
  isProblemDetails,
  isTransientError,
  isValidationProblemDetails,
} from "./errors";
import type { InternalConfig } from "./types";

const config: InternalConfig = { url: "/x", method: "GET" };

describe("isProblemDetails", () => {
  it("recognizes a ProblemDetails (RFC 7807)", () => {
    expect(isProblemDetails({ title: "Error", status: 400 })).toBe(true);
  });

  it("rejects objects that don't look like a ProblemDetails", () => {
    expect(isProblemDetails({ foo: "bar" })).toBe(false);
    expect(isProblemDetails(null)).toBe(false);
    expect(isProblemDetails("text")).toBe(false);
  });
});

describe("isValidationProblemDetails", () => {
  it("recognizes a per-field errors map", () => {
    expect(
      isValidationProblemDetails({
        title: "Error",
        status: 400,
        errors: { name: ["required"] },
      }),
    ).toBe(true);
  });

  it("rejects a ProblemDetails without errors", () => {
    expect(isValidationProblemDetails({ title: "Error", status: 500 })).toBe(
      false,
    );
  });
});

describe("HttpError", () => {
  it("exposes .problem when data matches a ProblemDetails", () => {
    const err = new HttpError("failed", config, {
      data: { title: "Error", status: 400, errors: { name: ["required"] } },
      status: 400,
      statusText: "Bad Request",
      config,
      raw: new Response(),
    });
    expect(err.problem?.title).toBe("Error");
  });

  it(".problem is undefined when data is not a ProblemDetails", () => {
    const err = new HttpError("failed", config, {
      data: "<html>error</html>",
      status: 502,
      statusText: "Bad Gateway",
      config,
      raw: new Response(),
    });
    expect(err.problem).toBeUndefined();
  });
});

describe("isHttpError", () => {
  it("recognizes an HttpError instance and rejects anything else", () => {
    const err = new HttpError("failed", config);
    expect(isHttpError(err)).toBe(true);
    expect(isHttpError(new Error("other"))).toBe(false);
    expect(isHttpError("string")).toBe(false);
  });
});

describe("isTransientError", () => {
  it("treats 502/503/504 as transient", () => {
    for (const status of [502, 503, 504]) {
      const err = new HttpError("failed", config, {
        data: null,
        status,
        statusText: "",
        config,
        raw: new Response(),
      });
      expect(isTransientError(err)).toBe(true);
    }
  });

  it("does not treat 400/404 as transient", () => {
    const err = new HttpError("failed", config, {
      data: null,
      status: 404,
      statusText: "",
      config,
      raw: new Response(),
    });
    expect(isTransientError(err)).toBe(false);
  });

  it("treats a missing response (network failure/timeout) as transient", () => {
    const err = new HttpError("Network failure", config);
    expect(isTransientError(err)).toBe(true);
  });

  it("never treats a non-HttpError as transient", () => {
    expect(isTransientError(new Error("anything"))).toBe(false);
  });
});
