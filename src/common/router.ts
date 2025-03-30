import SessionServer from "@GBlibs/webs/sessions/sessionserver";
import KeyMaker from "./keymaker";
import crypto from "crypto"

export default class AppRoutes {
    secret = ""
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
            return {ret, token}
        }
        return { ret, token: null }
    }
    async SessionCheck(token: string) {
        return this.session.verifyToken(token, this.secret)
    }
}