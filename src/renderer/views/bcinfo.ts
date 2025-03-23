import Card from "@GBlibs/webs/views/card";
import { IPage } from "@GBlibs/webs/views/page";

export default class BcInfo extends Card implements IPage {
    constructor() {
        super("html/bcinfo.html", "bcinfo", "BlockChain Info")
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        return false
    }
}