import KeyManager from "@GBlibs/key/keys";

export default class KeyMaker {
    id?: string
    pass?: string
    pubkey?: string
    privKey?: string
    constructor(private kmgr: KeyManager) {
    }
    
    async Login(id: string, pass: string) {
        const pubKey = await this.kmgr.getPublicKey(id)
        const privKey = await this.kmgr.getPrivateKey(id, pass)
        if (privKey == null) return false

        const newPub = this.kmgr.derivePublicKeyFromPrivateKey(privKey)
        if(newPub === pubKey) return true

        return false
    }

    async GetAccountList() {
        return await this.kmgr.listAllKeysWithValues()
    }
    async MakeNewAccount(id: string, pass: string) {
        const pair = this.kmgr.generateKeyPair()
        const pubKey = pair.publicKey
        const pirvKey = this.kmgr.encryptPrivateKey(pair.privateKey, pass)
        const ret = await this.kmgr.saveKeyPair(id, pass, pair.privateKey, pair.publicKey)
        this.pubkey = pair.publicKey
        this.privKey = pair.privateKey
        return {ret, pubKey, pirvKey}
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