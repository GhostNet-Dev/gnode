import { CardMap, FuncMap } from "@Webs/models/type"
import Page, { IPage } from "@Webs/views/page"
import DashboardPage from "./dashboard"
import { RendererNet } from "@Commons/renderernet"
import BcInfo from "../cards/bcinfo"
import { IChannel } from "@Commons/icom"
import Sessions from "@Webs/sessions/session"
import Mining from "../cards/mining"
import AccountInfo from "../cards/account"
import LogCard from "../cards/logs"
import NetInfo from "../cards/netinfo"
import BlockChainFactory from "@Commons/bcfactory"
import GossipP2P from "@GBlibs/network/gossipp2p"
import DHTPeer from "@GBlibs/network/dhtpeer"
import Setting from "../cards/setting"

export default class BCLoader extends Page implements IPage {
    constructor(
        private map: FuncMap, 
        private net: RendererNet,
        private channel: IChannel,
        private session: Sessions,
    ) {
        super("", { preload: false })
        console.log("BCLoader")
    }

    async Run(): Promise<boolean> {
        if(!this.net.net){
            window.ClickLoadPage('login', false)
            return false
        }
        this.map["dashboard"] = new DashboardPage(this.BuildCard())
        window.ClickLoadPage('dashboard', false)
        return true
    }
    Release(): void {
        console.log("BCLoader Release")
    }
    public BuildCard(): CardMap  {
        const bcfab = new BlockChainFactory(this.net.net!, this.net.dataNet!, this.channel)

        const cardMap: CardMap = {
            "bcinfo": new BcInfo(bcfab.blocks),
            "accinfo": new AccountInfo(this.channel, this.session),
            "mininginfo":  new Mining(this.channel, this.session, bcfab.blockState),
            "netinfo": new NetInfo(this.session, this.net.net!, bcfab.valid),
            "loginfo":  new LogCard(this.channel, this.session),
            "settings":  new Setting(this.channel, this.session, bcfab.saveData),
        };
        return cardMap;

    }
}