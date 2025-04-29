import BlockManager from "@GBlibs/blocks/blocks";
import PBFTConsensus from "@GBlibs/consensus/pbftconsensus";
import ValidatorManager from "@GBlibs/consensus/validators";
import PendingTransactionPool from "@GBlibs/txs/pendingtxs";
import TransactionManager from "@GBlibs/txs/txs";
import Blockchain from "./blockchain";
import KeyManager from "@GBlibs/key/keys";
import KeyMaker from "./keymaker";
import BlockStats from "@GBlibs/blocks/blockstate";
import { NetworkInterface } from "@GBlibs/network/inetwork";
import { LevelDBManager } from "@GBlibs/db/leveldbm";

export default class BlockChainFactory {
    dbMgr = new LevelDBManager();
    valid = new ValidatorManager()
    blocks = new BlockManager(this.valid, this.dbMgr)
    txs = new TransactionManager()
    pendingPool = new PendingTransactionPool()
    blockState =  new BlockStats(this.dbMgr)


    pbftCons: PBFTConsensus
    blockChain:Blockchain

    constructor(
        private keyMaker: KeyMaker, 
        private keys: KeyManager,
        private net: NetworkInterface,
    ) {
        /* Network */

        this.pbftCons = new PBFTConsensus(this.valid, this.blocks, this.txs, this.net)

        this.blockChain = new Blockchain(this.blocks, this.txs, this.pbftCons, this.net,
            this.pendingPool, this.keys)
    }
}