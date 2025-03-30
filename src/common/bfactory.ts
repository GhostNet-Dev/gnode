import BlockManager from "@GBlibs/blocks/blocks";
import PBFTConsensus from "@GBlibs/consensus/pbftconsensus";
import ValidatorManager from "@GBlibs/consensus/validators";
import DHTPeer from "@GBlibs/network/dhtpeer";
import GossipP2P from "@GBlibs/network/gossipp2p";
import PendingTransactionPool from "@GBlibs/txs/pendingtxs";
import TransactionManager from "@GBlibs/txs/txs";
import Blockchain from "./blockchain";
import KeyManager from "@GBlibs/key/keys";
import AppRoutes from "./router";
import KeyMaker from "./keymaker";
import SessionServer from "@GBlibs/webs/sessions/sessionserver";

export default class BlockChainFactory {
    valid = new ValidatorManager()
    blocks = new BlockManager(this.valid)
    txs = new TransactionManager()
    pendingPool = new PendingTransactionPool()
    keys = new KeyManager()
    keyMaker = new KeyMaker(this.keys)
    session = new SessionServer()

    /* Network */
    dhtPeer = new DHTPeer(this.keyMaker.pubkey)
    net = new GossipP2P(this.dhtPeer)

    pbftCons = new PBFTConsensus(this.valid, this.blocks, this.txs, this.net)

    blockChain = new Blockchain(this.blocks, this.txs, this.pbftCons, this.net, 
        this.pendingPool, this.keys)

    route = new AppRoutes(this.keyMaker, this.session)

    constructor() {

    }
}