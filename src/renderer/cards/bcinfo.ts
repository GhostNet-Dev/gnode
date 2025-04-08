import { IChannel } from "@Commons/icom";
import { Block } from "@GBlibs/blocks/blocktypes";
import { BlockInfo } from "@GBlibs/types/blockinfotypes";
import Card from "@GBlibs/webs/views/card";
import { IPage } from "@GBlibs/webs/views/page";
import { RouteType } from "../../types/routetypes";

export default class BcInfo extends Card implements IPage {
    constructor(private ch: IChannel) {
        super("html/bcinfo.html", "bcinfo", "BlockChain Info")
        ch.RegisterMsgHandler(RouteType.BlockInfoRes, (info: BlockInfo) => {
            const domHeight = document.getElementById("blkheight")
            if (domHeight) domHeight.innerText = info.height.toString()
            const domLatestHash = document.getElementById("latesthash")
            if (domLatestHash) domLatestHash.innerText = info.latestBlockHash
            const domTxsCount = document.getElementById("txscount")
            if (domTxsCount) domTxsCount.innerText = info.txsCount.toString()

            const getCnt = info.height - 10
            this.ch.SendMsg(RouteType.BlockListReq, info.height, (getCnt > 0) ? getCnt : 0)
        })
        ch.RegisterMsgHandler(RouteType.BlockListRes, (blocks: Block[]) => {

        })
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.ch.SendMsg(RouteType.BlockInfoReq)
        return false
    }
}