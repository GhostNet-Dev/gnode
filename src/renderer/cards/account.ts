import { IChannel } from "@Commons/icom";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";

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