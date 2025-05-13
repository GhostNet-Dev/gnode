import { IGenericDB } from "@GBlibs/db/dbtypes";
import { v4 as uuidv4 } from "uuid"
import { IChannel } from "./icom";
import { RouteType } from "../types/routetypes";

export class DBAdapter<T> implements IGenericDB<T> {
    private status: "open" | "closed" = "open";
    private streamQueues = new Map<string, Array<[string, T] | null>>(); // null = 끝

    constructor(
        private dbname: string,
        private ch: IChannel,
        private pending: Map<string, (data: any) => void>,
    ) {
    }

    async open(): Promise<void> {
        this.status = "open";
    }

    async get(key: string): Promise<T | undefined> {
        const id = uuidv4(); // 또는 다른 고유 ID 생성 방식

        return new Promise((resolve) => {
            this.pending.set(id, resolve);
            this.ch.SendMsg(RouteType.DbGetReq, id, this.dbname, key);
        });
    }

    async put(key: string, value: T): Promise<void> {
        const id = uuidv4(); // 또는 다른 고유 ID 생성 방식

        return new Promise((resolve) => {
            this.pending.set(id, resolve);
            this.ch.SendMsg(RouteType.DbPutReq, id, this.dbname, key, value);
        });
    }
    async del(key: string): Promise<void> {
        const id = uuidv4(); // 또는 다른 고유 ID 생성 방식

        return new Promise((resolve) => {
            this.pending.set(id, resolve);
            this.ch.SendMsg(RouteType.DbDelReq, id, this.dbname, key);
        });
    }

    // ✅ 스트리밍 기반 iterator
    async *iterator(): AsyncIterable<[string, T]> {
        const id = uuidv4();
        const queue: Array<[string, T] | null> = [];
        this.streamQueues.set(id, queue);

        // 스트리밍 청크 응답 핸들러
        this.ch.RegisterMsgHandler(RouteType.DbIterChunk, (data: any) => {
            const { id, chunk, done } = data;
            const queue = this.streamQueues.get(id);
            if (!queue) return;
            for (const entry of chunk) queue.push(entry);
            if (done) queue.push(null); // null을 끝 신호로 사용
        });
        this.ch.SendMsg(RouteType.DbIterReq, id, this.dbname, 50);

        while (true) {
            const item = await this.waitForItem(queue);
            if (item === null) break;
            yield item;
        }

        this.streamQueues.delete(id);
    }

    private waitForItem(queue: Array<[string, T] | null>): Promise<[string, T] | null> {
        return new Promise((resolve) => {
            const check = () => {
                if (queue.length > 0) {
                    resolve(queue.shift()!);
                } else {
                    setTimeout(check, 10); // 간단한 폴링 (Promise queue로 대체 가능)
                }
            };
            check();
        });
    }

    getStatus(): string {
        return this.status;
    }
}
