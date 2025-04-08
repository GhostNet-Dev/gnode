import SessionServer from "@GBlibs/webs/sessions/sessionserver";
import { BlockInfo } from "@GBlibs/types/blockinfotypes";
import KeyMaker from "./keymaker";
import crypto from "crypto"
import BlockChainFactory from "./bcfactory";
import { Block } from "@GBlibs/blocks/blocktypes";

export default class AppRoutes {
    secret = ""
    bcFab?: BlockChainFactory
    constructor(
        private keyMaker: KeyMaker,
        private session: SessionServer,
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
        if(ret) {
            this.secret = crypto.randomBytes(64).toString("hex")
            const token = this.session.generateToken(id, this.secret)
            this.bcFab = new BlockChainFactory(this.keyMaker, this.keyMaker.kmgr)
            return {ret, token}
        }
        return { ret, token: null }
    }
    async SessionCheck(token: string) {
        const ret = this.session.verifyToken(token, this.secret)
        if(ret != null && this.keyMaker.id == ret) {
            this.bcFab = new BlockChainFactory(this.keyMaker, this.keyMaker.kmgr)
        }
        return ret
    }
    async GetBlockInfo() {
        if(!this.bcFab) return 
        const latest = await this.bcFab.blocks.getLatestBlock()
        if(!latest) throw new Error("there is no block")
        const ret: BlockInfo = {
            height: latest.index,
            txsCount: latest.transactions.length,
            latestBlockHash: latest.hash,
        }
        return ret
    }
    async GetBlockList(height: number, count: number) {
        if(!this.bcFab) return []
        const start = height - count

        const ret = await Promise.all(
            Array.from({ length: count }, (_, i) => this.bcFab!.blocks.getBlock(start + i))
        )

        return ret
    }
}