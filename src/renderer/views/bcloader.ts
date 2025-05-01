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
        this.map["dashboard"] = new DashboardPage(this.BuildCard())
        window.ClickLoadPage('dashboard', false)
        return true
    }
    Release(): void {
        console.log("BCLoader Release")
    }
    public BuildCard(): CardMap  {
        const bcfab = new BlockChainFactory(this.net.net!, this.channel)

        const cardMap: CardMap = {
            "bcinfo": new BcInfo(bcfab.blocks),
            "mininginfo":  new Mining(this.channel, this.session, bcfab.blockState),
            "accinfo": new AccountInfo(this.channel, this.session),
            "netinfo": new NetInfo(this.session, this.net.net!, bcfab.valid),
            "loginfo":  new LogCard(this.channel, this.session),
        };
        return cardMap;

    }
}