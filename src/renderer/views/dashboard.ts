import { CardMap } from "@GBlibs/webs/models/type";
import Card from "@GBlibs/webs/views/card";
import Page, { IPage } from "@GBlibs/webs/views/page";


export default class DashboardPage extends Page implements IPage {
    constructor(cardMap: CardMap) {
        super("html/dashboard.html", { cardMap: cardMap })

        window.addEventListener('resize', () => {
            this.resize()
        })
        window.showCard = (type: string) => this.showCard(type)
    }
    async LoadCardHtml() {
        await Promise.all(Object.entries(this.cardMap).map(async ([key, card]) => {
            await (card as unknown as Card).LoadHtml()
        }))
    }
    removeFooter() {
        const footer = document.getElementById("footer")
        if(!footer) throw new Error("where is foot!!");
        footer.parentNode?.removeChild(footer)
        return footer
    }
    async ViewMenu() {
        const footer = this.removeFooter()
        document.body.appendChild(footer)
        footer.style.position = "fixed"
        footer.style.bottom = "0"
        footer.style.left = "0"
    }

    async Run(): Promise<boolean> {
        console.log("dashboard")
        await this.LoadHtml()
        await this.LoadCardHtml()
        await this.ViewMenu()
        this.showCard('blockchain');
        return true
    }
    Release(): void {
        this.removeFooter()
        this.ReleaseHtml()
    }
}