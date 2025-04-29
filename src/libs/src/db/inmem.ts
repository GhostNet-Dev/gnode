// InMemoryDB.ts
import { IGenericDB } from "./dbtypes";

export class InMemoryDB<T> implements IGenericDB<T> {
    private store = new Map<string, T>();
    private status: "open" | "closed" = "open";

    async open(): Promise<void> {
        this.status = "open";
    }

    async get(key: string): Promise<T | undefined> {
        return this.store.get(key);
    }

    async put(key: string, value: T): Promise<void> {
        this.store.set(key, value);
    }
    async del(key: string): Promise<void> {
        this.store.delete(key);
    }

    async *iterator(): AsyncIterable<[string, T]> {
        for (const [key, value] of this.store.entries()) {
            yield [key, value];
        }
    }

    getStatus(): string {
        return this.status;
    }
}
