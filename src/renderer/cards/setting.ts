import { IChannel } from "@Commons/icom";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import Sessions from "@Webs/sessions/session";
import TransactionManager from "@GBlibs/txs/txs";
import KeyMaker from "@Commons/keymaker";
import SaveData from "@GBlibs/utils/savedata";

export default class Setting extends Card implements IPage {
    constructor(
        private ch: IChannel, 
        private sess: Sessions,
        private saveData: SaveData,
    ) {
        super("html/setting.html", "settings", "Setting")
    }
    DrawHtml(): void { 
        const btn = document.getElementById("makeTx")
        if (btn) btn.onclick = async () => {
            this.saveData.Save("test_key", "test_value")
        }
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.DrawHtml()
        return false
    }
}