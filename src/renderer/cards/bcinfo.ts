import { BlockInfo } from "@GBlibs/types/blockinfotypes";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import BlockManager from "@GBlibs/blocks/blocks";

export default class BcInfo extends Card implements IPage {
    constructor(private blocks: BlockManager) {
        super("html/bcinfo.html", "bcinfo", "BlockChain Info")
    }
    Release(): void {
    }
    async DrawBlockList(height: number, count: number) {
        const start = height - count
        const blocks = await Promise.all(
            Array.from({ length: count }, (_, i) => this.blocks.getBlock(start + i))
        )
        let html = `
    <div class="row border-top p-4">
        <div class="col text-center"> ID</div>
        <div class="col text-center"> Hash</div>
        <div class="col text-center"> Txs</div>
    </div>`
        blocks.forEach((b) => {
            if (!b) return
            html += `
    <div class="row border-top">
        <div class="col text-center">${b.index}</div>
        <div class="col text-center">${b.hash}</div>
        <div class="col text-center">${b.transactions.length}</div>
    </div>
                `
        })
        const domTable = document.getElementById("blocklist")
        if (domTable) domTable.innerHTML = html
    }
    async DrawBlockInfo() {
        const latest = await this.blocks.getLatestBlock()
        if (!latest) throw new Error("there is no block")
        const info: BlockInfo = {
            height: latest.index + 1,
            txsCount: latest.transactions.length,
            latestBlockHash: latest.hash,
        }
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
        this.DrawBlockList(info.height, (getCnt < 0) ? Math.abs(getCnt) : 10)
    }
    async Run(): Promise<boolean> {
        this.DrawBlockInfo()
        return false
    }
}