import KeyManager from "@GBlibs/key/keys";
import AppRoutes from "./router";
import KeyMaker from "./keymaker";
import SessionServer from "@Webs/sessions/sessionserver";
import { LevelDBManager } from "@GBlibs/db/leveldbm";


export default class BootFactory {
    dbMgr = new LevelDBManager();
    keys = new KeyManager(this.dbMgr)
    keyMaker = new KeyMaker(this.keys)
    session = new SessionServer()
    route = new AppRoutes(this.keyMaker, this.session, this.dbMgr)

}