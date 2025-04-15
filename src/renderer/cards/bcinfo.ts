import { IChannel } from "@Commons/icom";
import { Block } from "@GBlibs/blocks/blocktypes";
import { BlockInfo } from "@GBlibs/types/blockinfotypes";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import { RouteType } from "../../types/routetypes";

export default class BcInfo extends Card implements IPage {
    constructor(private ch: IChannel) {
        super("html/bcinfo.html", "bcinfo", "BlockChain Info")
        ch.RegisterMsgHandler(RouteType.BlockInfoRes, (info: BlockInfo) => {
            if (!info) {
                window.ClickLoadPage('login', false)
                return
            }
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
            let html = ``
            blocks.forEach((b) => {
                html += `
    <div class="row border-top">
        <div class="col">${b.index}</div>
        <div class="col">${b.hash}</div>
        <div class="col">${b.transactions.length}</div>
    </div>
                `
            })
            const domTable = document.getElementById("blocklist")
            domTable?.insertAdjacentHTML("beforeend", html)
        })
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.ch.SendMsg(RouteType.BlockInfoReq)
        return false
    }
}