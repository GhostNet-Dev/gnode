import KeyManager from "@GBlibs/key/keys";
import AppRoutes from "./router";
import KeyMaker from "./keymaker";
import SessionServer from "@GBlibs/webs/sessions/sessionserver";


export default class BootFactory {
    keys = new KeyManager()
    keyMaker = new KeyMaker(this.keys)
    session = new SessionServer()
    route = new AppRoutes(this.keyMaker, this.session)

}