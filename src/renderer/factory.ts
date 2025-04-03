import { IChannel } from "@Commons/icom";
import { Channel } from "./provider";
import { CardMap, FuncMap } from "@GBlibs/webs/models/type";
import BcInfo from "./cards/bcinfo";
import Mining from "./cards/mining";
import DashboardPage from "./views/dashboard";
import LoginPage from "./views/login";
import MakeAccountPage from "./views/makeaccount";
import Sessions from "@GBlibs/webs/sessions/session";
import LogoutPage from "./views/logout";
import AccountInfo from "./cards/account";

declare global {
    interface Window {
        showCard(type: string): void,
        ClickLoadPage: (key: string, from: boolean, ...arg: string[]) => void;
    }
}

export default class RendererFactory {
    channel: IChannel = new Channel(3001)
    session = new Sessions()
    bcInfo = new BcInfo(this.channel)
    accinfo = new AccountInfo(this.channel)
    mining = new Mining(this.channel)
    login = new LoginPage(this.channel, this.session)
    logout = new LogoutPage(this.session)
    makeAcc = new MakeAccountPage(this.channel)
    dash = new DashboardPage(this.BuildCard())

    async Initialize() {
        // await this.bcInfo.LoadHtml()
        // await this.mining.LoadHtml()
    }

    public Build(): FuncMap {
        const funcMap: FuncMap = {
            "dashboard": this.dash,
            "login": this.login,
            "logout": this.logout,
            "makeacc": this.makeAcc,
            "main": this.login,
        };
        return funcMap;
    }
    public BuildCard(): CardMap {
        const cardMap: CardMap = {
            "bcinfo": this.bcInfo,
            "mininginfo": this.mining,
            "accinfo": this.accinfo,
        };
        return cardMap;

    }
}