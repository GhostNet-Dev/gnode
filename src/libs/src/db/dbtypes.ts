// IGenericDB.ts
export interface IGenericDB<T> {
  open(): Promise<void>;
  get(key: string): Promise<T | undefined>;
  put(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>; // ✅ 삭제 메서드 추가
  iterator(): AsyncIterable<[string, T]>;
  getStatus(): string;
}


export interface IDBManager {
  getDB<T>(name: string): IGenericDB<T>;
}