import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import { NetData } from "../../types/infotypes";
import Sessions from "@Webs/sessions/session";
import ValidatorManager from "@GBlibs/consensus/validators";
import { INetworkInterface } from "@GBlibs/network/inetwork";

export default class NetInfo extends Card implements IPage {
    constructor(
        private sess: Sessions, 
        private net: INetworkInterface, 
        private valid: ValidatorManager
    ) {
        super("html/netinfo.html", "netinfo", "Network Infomation")
    }
    drawValidators(info: NetData) {
        const domNodeCnt = document.getElementById("nodecount")
        if (domNodeCnt) domNodeCnt.innerText = this.net.Peers.length.toString()
        const domValidators = document.getElementById("validatorlist")
        if (domValidators) domValidators.innerHTML = info.validators.map((v) => v.publicKey).join("<br>")
    }
    GetNetInfo() { 
        let peerAddrs:string[] = []
        return { 
            peerAddrs,
            validators: this.valid.getValidators()
        }
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.drawValidators(this.GetNetInfo())
        return false
    }
}