import Sessions from "@GBlibs/webs/sessions/session";
import Page, { IPage } from "@GBlibs/webs/views/page";

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