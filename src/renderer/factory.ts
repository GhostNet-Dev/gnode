import { IChannel } from "@Commons/icom";
import { Channel } from "./provider";
import { CardMap, FuncMap } from "@Webs/models/type";
import BcInfo from "./cards/bcinfo";
import Mining from "./cards/mining";
import DashboardPage from "./views/dashboard";
import LoginPage from "./views/login";
import MakeAccountPage from "./views/makeaccount";
import Sessions from "@Webs/sessions/session";
import LogoutPage from "./views/logout";
import AccountInfo from "./cards/account";
import NetInfo from "./cards/netinfo";
import LogCard from "./cards/logs";
import DHTPeer from "@GBlibs/network/dhtpeer";
import GossipP2P from "@GBlibs/network/gossipp2p";
import { RouteType } from "src/types/routetypes";
import { RendererNet } from "@Commons/renderernet";

declare global {
    interface Window {
        showCard(type: string): void,
        ClickLoadPage: (key: string, from: boolean, ...arg: string[]) => void;
    }
}

export default class RendererFactory {
    channel: IChannel = new Channel(3001)
    session = new Sessions()
    net = new RendererNet()
    bcInfo = new BcInfo(this.channel)
    accinfo = new AccountInfo(this.channel, this.session)
    mining = new Mining(this.channel, this.session)
    netinfo = new NetInfo(this.channel, this.session, this.net)
    loginfo = new LogCard(this.channel, this.session)
    login = new LoginPage(this.channel, this.session, this.net)
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
            "netinfo": this.netinfo,
            "loginfo": this.loginfo,
        };
        return cardMap;

    }
}