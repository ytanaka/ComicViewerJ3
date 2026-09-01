import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function assert_eq<T>(a: T, b: T) {
  if (a !== b) throw Error(`assertion error: ${a} !== ${b}`);
}

export class ExecExclusibe {
  private ids: Set<number>;

  constructor() {
    this.ids = new Set();
  }

  async try_start<T>(id: number, fn: () => Promise<T>): Promise<T | undefined> {
    if (!this.start(id)) return undefined;
    try {
      return await fn();
    } finally {
      this.end(id);
    }
  }

  private start(id: number): boolean {
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    return true;
  }

  private end(id: number) {
    if (!this.ids.has(id)) throw new Error(`no id: ${id}`);
    this.ids.delete(id);
  }
}

export class AsyncLimiter {
  private running = 0;
  private readonly limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (this.running >= this.limit) {
      return undefined;
    }

    this.running++;

    try {
      return await fn();
    } finally {
      this.running--;
    }
  }
}
class ObjectId {
  private readonly map = new WeakMap<object, number>();
  private nextId = 1;

  get(obj: object): number {
    let id = this.map.get(obj);

    if (id === undefined) {
      id = this.nextId++;
      this.map.set(obj, id);
    }

    return id;
  }

  has(obj: object): boolean {
    return this.map.has(obj);
  }
}
const objectId = new ObjectId();
// オブジェクト参照の変化を観察するために、オブジェクトをID文字列に変換する
export function getObjId(t: object | undefined) {
  if (!t) return 'undef';
  return '0x' + objectId.get(t).toString(16).toUpperCase().padStart(4, '0');
}
