import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function assert_same_ref<T>(a: T, b: T) {
  if (a !== b) throw Error(`assertion error: ${a} !== ${b}`);
}

export class ExecExclusibe {
  private ids: Set<number>;

  constructor() {
    this.ids = new Set();
  }

  try_start(id: number): boolean {
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    return true;
  }

  end(id: number) {
    if (!this.ids.has(id)) throw new Error(`no id: ${id}`);
    this.ids.delete(id);
  }
}