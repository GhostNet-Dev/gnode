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

    async Run(): Promise<boolean> {
        console.log("dashboard")
        await this.LoadHtml()
        await this.LoadCardHtml()
        this.showCard('blockchain');
        return true
    }
    Release(): void {
        this.ReleaseHtml()
    }
}