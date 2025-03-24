import KeyManager from "@GBlibs/key/keys";

export default class KeyMaker {
    id?: string
    pass?: string
    pubkey?: string
    privKey?: string
    constructor(private kmgr: KeyManager) {
    }

    MakeNewAccount(id: string, pass: string) {
        const pair = this.kmgr.generateKeyPair()
        this.kmgr.saveKeyPair(id, pass, pair.privateKey, pair.publicKey)
        this.pubkey = pair.publicKey
        this.privKey = pair.privateKey
        return pair.publicKey
    }
    async LoadKeyPair(id: string, pass: string) {
        try {
            const pubKey = await this.kmgr.getPublicKey(id)
            const privKey = await this.kmgr.getPrivateKey(id, pass)

            if (pubKey == null || privKey == null) return false
            this.pubkey = pubKey
            this.privKey = privKey
        } catch (error) {
            console.log(error)
            return false
        }
        return true
    }
}