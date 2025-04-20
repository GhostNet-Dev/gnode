import SessionServer from "@Webs/sessions/sessionserver";
import { BlockInfo } from "@GBlibs/types/blockinfotypes";
import KeyMaker from "./keymaker";
import crypto from "crypto"
import BlockChainFactory from "./bcfactory";
import { AccountData, NetData } from "src/types/infotypes";
import { logger } from "@GBlibs/logger/logger";
import { Handler } from "./icom";
import { NetAdapter } from "src/server/netadpater";
import { WebSocket } from "ws";
import { NetworkInterface } from "@GBlibs/network/inetwork";

export default class AppRoutes {
    secret = ""
    bcFab?: BlockChainFactory
    net?: NetworkInterface
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
    async NetStart(net: NetworkInterface) {
        this.net = net
        this.bcFab = new BlockChainFactory(this.keyMaker, this.keyMaker.kmgr, this.net)
    }
    async Login(id: string, pass: string) {
        const ret = await this.keyMaker.Login(id, pass)
        if(ret) {
            this.secret = crypto.randomBytes(64).toString("hex")
            const token = this.session.generateToken(id, this.secret)
            return {ret, token, addr: this.keyMaker.GetBase58PubKey()}
        }
        return { ret, token: null, addr: null }
    }
    async SessionCheck(token: string) {
        if(!this.net) return

        const ret = this.session.verifyToken(token, this.secret)
        if(ret != null && this.keyMaker.id == ret) {
            this.bcFab = new BlockChainFactory(this.keyMaker, this.keyMaker.kmgr, this.net)
        }
        return { ret, addr: this.keyMaker.GetBase58PubKey() }
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
    GetNetInfo(): NetData | undefined { 
        if(!this.bcFab) return 
        let peerAddrs:string[] = []
        return { 
            peerAddrs,
            validators: this.bcFab.valid.getValidators()
        }
    }
    GetLogs() {
        return logger.getBuffer()
    }
}