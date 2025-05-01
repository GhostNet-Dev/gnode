// LevelDBManager.ts
import { IDBManager, IGenericDB } from "@GBlibs/db/dbtypes";
import { Level } from "level";
import { DBAdapter } from "./dbadapter";
import { IChannel } from "./icom";

export class DBAdapterManager implements IDBManager {
  private dbCache = new Map<string, IGenericDB<any>>();
  constructor(private ch: IChannel) { }

  getDB<T>(name: string): IGenericDB<T> {
    if (this.dbCache.has(name)) {
      return this.dbCache.get(name) as IGenericDB<T>;
    }

    const wrapper = new DBAdapter<T>(name, this.ch);
    this.dbCache.set(name, wrapper);
    return wrapper;
  }
}

