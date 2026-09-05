type Fulfilled<T> = (value: T) => T | Promise<T>;

type Rejected<T> = (error: unknown) => T | Promise<T>;

type Handler<T> = {
  fulfilled?: Fulfilled<T>;
  rejected?: Rejected<T>;
};

export class InterceptorManager<T> {
  private handlers: Array<Handler<T> | null> = [];

  use(fulfilled?: Fulfilled<T>, rejected?: Rejected<T>): number {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  forEach(fn: (h: Handler<T>) => void): void {
    this.handlers.forEach((h) => {
      if (h) {
        fn(h);
      }
    });
  }
}
