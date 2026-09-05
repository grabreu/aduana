import { describe, expect, it, vi } from "vitest";
import { InterceptorManager } from "./interceptors";

describe("InterceptorManager", () => {
  it("use returns sequential ids starting at 0", () => {
    const manager = new InterceptorManager<number>();
    expect(manager.use((v) => v)).toBe(0);
    expect(manager.use((v) => v)).toBe(1);
    expect(manager.use((v) => v)).toBe(2);
  });

  it("forEach calls handlers in the order they were registered", () => {
    const manager = new InterceptorManager<number>();
    const order: number[] = [];
    manager.use(() => {
      order.push(1);
      return 1;
    });
    manager.use(() => {
      order.push(2);
      return 2;
    });

    manager.forEach(({ fulfilled }) => {
      fulfilled?.(0);
    });
    expect(order).toEqual([1, 2]);
  });

  it("eject stops the handler from running, without affecting other ids", () => {
    const manager = new InterceptorManager<number>();
    const firstFulfilled = vi.fn((v: number) => v);
    const secondFulfilled = vi.fn((v: number) => v);
    const id = manager.use(firstFulfilled);
    manager.use(secondFulfilled);

    manager.eject(id);
    manager.forEach(({ fulfilled }) => {
      fulfilled?.(0);
    });

    expect(firstFulfilled).not.toHaveBeenCalled();
    expect(secondFulfilled).toHaveBeenCalledTimes(1);
  });

  it("ejecting the same id twice does not throw", () => {
    const manager = new InterceptorManager<number>();
    const id = manager.use((v) => v);

    expect(() => {
      manager.eject(id);
      manager.eject(id);
    }).not.toThrow();
  });

  it("ejecting an out-of-range id does not throw", () => {
    const manager = new InterceptorManager<number>();
    manager.use((v) => v);

    expect(() => manager.eject(99)).not.toThrow();
  });

  it("accepts registering only fulfilled, only rejected, or both", () => {
    const manager = new InterceptorManager<number>();
    const onlyFulfilled = vi.fn((v: number) => v);
    const onlyRejected = vi.fn((_e: unknown) => 0);

    manager.use(onlyFulfilled);
    manager.use(undefined, onlyRejected);

    manager.forEach(({ fulfilled, rejected }) => {
      fulfilled?.(1);
      rejected?.(new Error("x"));
    });

    expect(onlyFulfilled).toHaveBeenCalledWith(1);
    expect(onlyRejected).toHaveBeenCalledWith(new Error("x"));
  });
});
