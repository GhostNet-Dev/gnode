import KeyManager from "@GBlibs/key/keys";
import AppRoutes from "./router";
import KeyMaker from "./keymaker";
import SessionServer from "@Webs/sessions/sessionserver";
import { LevelDBManager } from "@GBlibs/db/leveldbm";
import { WebCryptoProvider } from "@GBlibs/key/webcrypto";


export default class BootFactory {
    crypto = new WebCryptoProvider()
    dbMgr = new LevelDBManager();
    keys = new KeyManager(this.dbMgr, this.crypto)
    keyMaker = new KeyMaker(this.keys)
    session = new SessionServer()
    route = new AppRoutes(this.keyMaker, this.session, this.dbMgr)
}