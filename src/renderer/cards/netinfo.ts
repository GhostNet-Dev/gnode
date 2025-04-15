import { IChannel } from "@Commons/icom";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import { AccountData } from "../../types/infotypes";
import { RouteType } from "../../types/routetypes";
import Sessions from "@Webs/sessions/session";

export default class NetInfo extends Card implements IPage {
    constructor(private ch: IChannel, private sess: Sessions) {
        super("html/netinfo.html", "netinfo", "Network Infomation")
        ch.RegisterMsgHandler(RouteType.GetPeersRes, (info: string[]) => {
            const domNodeCnt = document.getElementById("nodecount")
            if (domNodeCnt) domNodeCnt.innerText = info.length.toString()
        })
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.ch.SendMsg(RouteType.GetPeersReq)
        return false
    }
}