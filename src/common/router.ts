import SessionServer from "@Webs/sessions/sessionserver";
import { BlockInfo } from "@GBlibs/types/blockinfotypes";
import KeyMaker from "./keymaker";
import crypto from "crypto"
import BlockChainFactory from "./bcfactory";
import { AccountData, NetData } from "src/types/infotypes";
import { logger } from "@GBlibs/logger/logger";
import { INetworkInterface } from "@GBlibs/network/inetwork";
import { IDBManager } from "@GBlibs/db/dbtypes";

export default class AppRoutes {
    secret = ""
    net?: INetworkInterface
    constructor(
        private keyMaker: KeyMaker,
        private session: SessionServer,
        private dbMgr: IDBManager,
    ) {
    }
    async LoadKeys(id: string, pass: string) {
        return await this.keyMaker.LoadKeyPair(id, pass)
    }
    async MakeAccount(id: string, pass: string) {
        return await this.keyMaker.MakeNewAccount(id, pass)
    }
    async GetAcountList() {
        return await this.keyMaker.GetAccountList()
    }
    async Login(id: string, pass: string) {
        const ret = await this.keyMaker.Login(id, pass)
        if (ret) {
            this.secret = crypto.randomBytes(64).toString("hex")
            const token = this.session.generateToken(id, this.secret)
            return { ret, token, addr: this.keyMaker.GetBase58PubKey() }
        }
        return { ret, token: null, addr: null }
    }
    async SessionCheck(token: string) {
        if (!this.net) return

        const ret = this.session.verifyToken(token, this.secret)
        return { ret, addr: this.keyMaker.GetBase58PubKey() }
    }
    async GetAccountInfo(token: string) {
        const ret = this.session.verifyToken(token, this.secret)
        logger.info(ret, this.keyMaker.id)
        if (ret != null && this.keyMaker.id == ret) {
            const data: AccountData = {
                addr: this.keyMaker.GetBase58PubKey(),
                coins: 0, // TODO
            }
            return data
        }
        return undefined
    }

    GetLogs() {
        return logger.getBuffer()
    }
    async streamDBChunks<T>(
        dbname: string,
        chunkSize: number,
        onChunk: (chunk: [string, T][], done: boolean) => void
    ) {
        const db = this.dbMgr.getDB<T>(dbname);
        const iterator = db.iterator();
        let chunk: [string, T][] = [];

        for await (const [key, value] of iterator) {
            chunk.push([key, value]);
            if (chunk.length >= chunkSize) {
                onChunk(chunk, false);
                chunk = [];
            }
        }

        // 마지막 chunk 처리
        onChunk(chunk, true);
    }
    async getDBValue<T>(
        dbname: string,
        key: string
    ): Promise<T | undefined> {
        const db = this.dbMgr.getDB<T>(dbname);
        return await db.get(key);
    }
    async putDBValue<T>(
        dbname: string,
        key: string,
        value: T
    ): Promise<void> {
        const db = this.dbMgr.getDB<T>(dbname);
        await db.put(key, value);
    }
    async delDBValue<T>(
        dbname: string,
        key: string
    ): Promise<void> {
        const db = this.dbMgr.getDB<T>(dbname);
        await db.del(key);
    }
}