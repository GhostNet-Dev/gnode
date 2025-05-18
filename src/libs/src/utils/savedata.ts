import KeyMaker from "@Commons/keymaker";
import DHTPeer from "@GBlibs/network/dhtpeer";
import { IDataNet } from "@GBlibs/network/inetwork";
import TransactionManager from "@GBlibs/txs/txs";


export default class SaveData {
    constructor(
        private txs: TransactionManager,
        private key: KeyMaker,
        private peerNet: IDataNet,
    ) {

    }
    async Save(key: string, value: string) {
        if (!this.key.pubkey || !this.key.privKey) throw new Error("there is no pubkey");
        const pubKey = await this.key.GetBase58PubKey()

        this.txs.createHashedDataTransaction(
            this.key.pubkey,
            this.key.privKey,
            pubKey, "test", "value", "test")
        this.peerNet.storeData(key, value);
    }
}