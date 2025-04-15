import SessionServer from "@Webs/sessions/sessionserver";
import { BlockInfo } from "@GBlibs/types/blockinfotypes";
import KeyMaker from "./keymaker";
import crypto from "crypto"
import BlockChainFactory from "./bcfactory";
import { AccountData } from "src/types/infotypes";
import { logger } from "@GBlibs/logger/logger";

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
    async GetAccountInfo(token: string) {
        const ret = this.session.verifyToken(token, this.secret)
        logger.info(ret, this.keyMaker.id)
        if(ret != null && this.keyMaker.id == ret) {
            const data: AccountData = {
                addr: this.keyMaker.GetBase58PubKey(),
                coins: 0, // TODO
            }
            return data
        }
        return undefined
    }
    async GetBlock(year: number, month: number, day: number) {
        if(!this.bcFab) return
        const ret = await this.bcFab.blockState.getBlocksForDateGrouped(year, month, day)
        if(Object.keys(ret).length == 0)  {
            const timeKey = `${year}-${month}-${day}`;
            ret[timeKey] = []
        }
        return ret
    }
    async GetPeers() { 
        if(!this.bcFab) return []
        let peerAddr:string[] = []
        this.bcFab.dhtPeer.peers.forEach((_, key) => {
            peerAddr.push(key)
        })
        return peerAddr
    }
    GetLogs() {
        return logger.getBuffer()
    }
}