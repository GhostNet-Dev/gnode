// LevelDBManager.ts
import { IDBManager, IGenericDB } from "@GBlibs/db/dbtypes";
import { DBAdapter } from "./dbadapter";
import { IChannel } from "./icom";
import { RouteType } from "../types/routetypes";

export class DBAdapterManager implements IDBManager {
  private dbCache = new Map<string, IGenericDB<any>>();
  private pending = new Map<string, (data: any) => void>();

  constructor(private ch: IChannel) {
    ch.RegisterMsgHandler(RouteType.DbRes, (data: any) => {
      const id = data.id;
      const resolve = this.pending.get(id);
      if (!resolve) return;
      resolve(data.res ?? "");
      this.pending.delete(id);
    })

  }

  getDB<T>(name: string): IGenericDB<T> {
    if (this.dbCache.has(name)) {
      return this.dbCache.get(name) as IGenericDB<T>;
    }

    const wrapper = new DBAdapter<T>(name, this.ch, this.pending);
    this.dbCache.set(name, wrapper);
    return wrapper;
  }
}

