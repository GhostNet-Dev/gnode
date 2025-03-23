import { IChannel } from "@Commons/icom";
import { Channel } from "./provider";
import { FuncMap } from "@GBlibs/webs/models/type";
import BcInfo from "./views/bcinfo";

export default class RendererFactory {
    channel: IChannel = new Channel(3000)
    bcInfo = new BcInfo()

    async Initialize() {
        await this.bcInfo.LoadHtml()
    }

    public Build(): FuncMap {

        const funcMap: FuncMap = {
            "bcInfo": this.bcInfo,
        };
        return funcMap;
    }
}