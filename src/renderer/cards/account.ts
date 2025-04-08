import { IChannel } from "@Commons/icom";
import Card from "@GBlibs/webs/views/card";
import { IPage } from "@GBlibs/webs/views/page";

export default class AccountInfo extends Card implements IPage {
    constructor(private ch: IChannel) {
        super("html/account.html", "accinfo", "My Account")
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        return false
    }
}