import { IChannel } from "@Commons/icom";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import { AccountData } from "../../types/infotypes";
import { RouteType } from "../../types/routetypes";
import Sessions from "@Webs/sessions/session";

export default class AccountInfo extends Card implements IPage {
    constructor(private ch: IChannel, private sess: Sessions) {
        super("html/account.html", "accinfo", "My Account")
        ch.RegisterMsgHandler(RouteType.AccountInfoRes, (info: AccountData) => {
            if (!info) {
                window.ClickLoadPage('login', false)
                return
            }

            const domHeight = document.getElementById("addr")
            if (domHeight) domHeight.innerText = info.addr
            const domLatestHash = document.getElementById("balance")
            if (domLatestHash) domLatestHash.innerText = info.coins.toString()
        })
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.ch.SendMsg(RouteType.AccountInfoReq, this.sess.getToken())
        return false
    }
}