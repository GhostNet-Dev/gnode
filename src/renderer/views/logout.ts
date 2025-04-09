import Sessions from "src/wlibs/src/sessions/session";
import Page, { IPage } from "@Webs/views/page";

export default class LogoutPage extends Page implements IPage {
    constructor(private sess: Sessions) {
        super("")
    }
    async Run(): Promise<boolean> {
        this.sess.removeToken()
        window.ClickLoadPage('login', false)
        return false
    }
    Release(): void {
        
    }
}