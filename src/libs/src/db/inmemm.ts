// MemoryDBManager.ts
import { IDBManager, IGenericDB } from "./dbtypes";
import { InMemoryDB } from "./inmem";

export class MemoryDBManager implements IDBManager {
  private dbCache = new Map<string, IGenericDB<any>>();

  getDB<T>(name: string): IGenericDB<T> {
    if (!this.dbCache.has(name)) {
      this.dbCache.set(name, new InMemoryDB<T>());
    }
    return this.dbCache.get(name)!;
  }
}
