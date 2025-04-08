import BlockManager from "@GBlibs/blocks/blocks";
import PBFTConsensus from "@GBlibs/consensus/pbftconsensus";
import ValidatorManager from "@GBlibs/consensus/validators";
import DHTPeer from "@GBlibs/network/dhtpeer";
import GossipP2P from "@GBlibs/network/gossipp2p";
import PendingTransactionPool from "@GBlibs/txs/pendingtxs";
import TransactionManager from "@GBlibs/txs/txs";
import Blockchain from "./blockchain";
import KeyManager from "@GBlibs/key/keys";
import KeyMaker from "./keymaker";
import { logger } from "@GBlibs/logger/logger";

export default class BlockChainFactory {
    valid = new ValidatorManager()
    blocks = new BlockManager(this.valid)
    txs = new TransactionManager()
    pendingPool = new PendingTransactionPool()

    /* Network */
    dhtPeer: DHTPeer
    net:GossipP2P

    pbftCons: PBFTConsensus
    blockChain:Blockchain

    constructor(
        private keyMaker: KeyMaker, 
        private keys: KeyManager,
    ) {
        /* Network */
        this.dhtPeer = new DHTPeer(this.keyMaker.GetBase58PubKey())
        this.net = new GossipP2P(this.dhtPeer)

        this.pbftCons = new PBFTConsensus(this.valid, this.blocks, this.txs, this.net)

        this.blockChain = new Blockchain(this.blocks, this.txs, this.pbftCons, this.net,
            this.pendingPool, this.keys)
    }
}