import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
