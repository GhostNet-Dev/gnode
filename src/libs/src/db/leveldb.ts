import { Level } from "level";
import { IGenericDB } from "./dbtypes";

export class LevelWrapper<T> implements IGenericDB<T> {
    constructor(private db: Level<string, T>) { }

    async open() {
        if (this.db.status !== "open") await this.db.open();
    }

    async get(key: string) {
        try {
            return await this.db.get(key);
        } catch {
            return undefined;
        }
    }

    async put(key: string, value: T) {
        await this.db.put(key, value);
    }
    // LevelWrapper.ts
    async del(key: string): Promise<void> {
        await this.db.del(key);
    }


    async *iterator(): AsyncIterable<[string, T]> {
        for await (const [key, value] of this.db.iterator() ) {
            yield [key, value];
        }
    }

    getStatus(): string {
        return this.db.status;
    }
}