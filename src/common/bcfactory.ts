import BlockManager from "@GBlibs/blocks/blocks";
import PBFTConsensus from "@GBlibs/consensus/pbftconsensus";
import ValidatorManager from "@GBlibs/consensus/validators";
import PendingTransactionPool from "@GBlibs/txs/pendingtxs";
import TransactionManager from "@GBlibs/txs/txs";
import Blockchain from "./blockchain";
import KeyManager from "@GBlibs/key/keys";
import KeyMaker from "./keymaker";
import BlockStats from "@GBlibs/blocks/blockstate";
import { IDataNet, INetworkInterface } from "@GBlibs/network/inetwork";
import { IChannel } from "./icom";
import { DBAdapterManager } from "./dbmadapter";
import { WebCryptoProvider } from "@GBlibs/key/webcrypto";
import SaveData from "@GBlibs/utils/savedata";

export default class BlockChainFactory {
    dbMgr: DBAdapterManager
    valid: ValidatorManager
    blocks: BlockManager
    txs: TransactionManager
    pendingPool: PendingTransactionPool
    blockState: BlockStats
    keys: KeyManager
    keyMaker: KeyMaker


    pbftCons: PBFTConsensus
    blockChain: Blockchain
    saveData: SaveData

    constructor(
        private net: INetworkInterface,
        private dataNet: IDataNet,
        private ch: IChannel,
    ) {
        const crypto = new WebCryptoProvider();
        this.dbMgr = new DBAdapterManager(this.ch);
        this.keys = new KeyManager(this.dbMgr, crypto)
        this.keyMaker = new KeyMaker(this.keys)
        this.valid = new ValidatorManager(this.dbMgr)
        this.blocks = new BlockManager(this.valid, this.dbMgr, crypto)
        this.txs = new TransactionManager(this.dbMgr, crypto)
        this.pendingPool = new PendingTransactionPool(this.dbMgr)
        this.blockState = new BlockStats(this.dbMgr)
        /* Network */

        this.pbftCons = new PBFTConsensus(this.valid, this.blocks, this.txs, this.net)

        this.blockChain = new Blockchain(this.blocks, this.txs, this.pbftCons, this.net,
            this.pendingPool, this.keys)

        this.saveData = new SaveData(this.txs, this.keyMaker, this.dataNet)
            
    }
}