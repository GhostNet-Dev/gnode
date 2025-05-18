import { FuncMap } from "@Webs/models/type";
import LoginPage from "./views/login";
import LogoutPage from "./views/logout";
import MakeAccountPage from "./views/makeaccount";
import Sessions from "@Webs/sessions/session";
import { IChannel } from "@Commons/icom";
import { Channel } from "./provider";
import { RendererNet } from "@Commons/renderernet";
import BCLoader from "./views/bcloader";

declare global {
    interface Window {
        showCard(type: string): void,
        ClickLoadPage: (key: string, from: boolean, ...arg: string[]) => void;
    }
}

export default class BootRenderFactory {
    channel: IChannel = new Channel(3001)
    session = new Sessions()
    makeAcc = new MakeAccountPage(this.channel)
    net = new RendererNet(this.channel)
    login = new LoginPage(this.channel, this.session, this.net)
    logout = new LogoutPage(this.session)
    funcMap: FuncMap = {
        "login": this.login,
        "logout": this.logout,
        "makeacc": this.makeAcc,
        "main": this.login,
    };
    constructor() {
        this.funcMap["dashboard"] = new BCLoader(this.funcMap, this.net, this.channel, this.session)

    }

    public Build(): FuncMap {
        return this.funcMap;
    }
}