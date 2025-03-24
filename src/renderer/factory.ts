import { IChannel } from "@Commons/icom";
import { Channel } from "./provider";
import { FuncMap } from "@GBlibs/webs/models/type";
import BcInfo from "./views/bcinfo";
import Mining from "./views/mining";

export default class RendererFactory {
    channel: IChannel = new Channel(3001)
    bcInfo = new BcInfo()
    mining = new Mining(this.channel)

    async Initialize() {
        await this.bcInfo.LoadHtml()
        await this.mining.LoadHtml()
    }

    public Build(): FuncMap {
        const funcMap: FuncMap = {
            "bcinfo": this.bcInfo,
            "mininginfo": this.mining,
        };
        return funcMap;
    }
}