import { IChannel } from "@Commons/icom";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import { AccountData, NetData } from "../../types/infotypes";
import { RouteType } from "../../types/routetypes";
import Sessions from "@Webs/sessions/session";
import { RendererNet } from "@Commons/renderernet";

export default class NetInfo extends Card implements IPage {
    constructor(private ch: IChannel, private sess: Sessions, net: RendererNet) {
        super("html/netinfo.html", "netinfo", "Network Infomation")
        ch.RegisterMsgHandler(RouteType.GetNetInfoRes, (info: NetData) => {
            const domNodeCnt = document.getElementById("nodecount")
            if (domNodeCnt) domNodeCnt.innerText = net.net!.Peers.length.toString()
            const domValidators = document.getElementById("validatorlist")
            if(domValidators) domValidators.innerHTML = info.validators.map((v) => v.publicKey).join("<br>")   
        })
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.ch.SendMsg(RouteType.GetNetInfoReq)
        return false
    }
}