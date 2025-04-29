// LevelDBManager.ts
import { Level } from "level";
import { IDBManager, IGenericDB } from "./dbtypes";
import { LevelWrapper } from "./leveldb";

export class LevelDBManager implements IDBManager {
  private dbCache = new Map<string, IGenericDB<any>>();

  getDB<T>(name: string): IGenericDB<T> {
    if (this.dbCache.has(name)) {
      return this.dbCache.get(name) as IGenericDB<T>;
    }

    const level = new Level<string, T>(`./db/${name}`, { valueEncoding: "json" });
    const wrapper = new LevelWrapper<T>(level);
    this.dbCache.set(name, wrapper);
    return wrapper;
  }
}
