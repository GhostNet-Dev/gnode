import { CardMap } from "../models/type"

export interface IPage {
    Run(): Promise<boolean>
    Release(): void
}

export default class Page {
    page?: string
    active: boolean = false
    cardMap: CardMap
    CurrentPage?: IPage

    constructor(protected url: string, { preload = false, cardMap = {}}: 
        { preload?: boolean, cardMap?: CardMap } = {}
    ) {
        this.cardMap = cardMap
        if (preload) {
            this.LoadHtml()
        }
    }
    addHtml(html: string) {
        const content = document.querySelector("contents") as HTMLDivElement
        content.insertAdjacentHTML("beforeend", html)
    }
    getParam(k: string): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        const email = encodeURIComponent(urlParams.get(k) ?? "");
        if (email == null || email == "") return null;
        return email;
    }
    async LoadHtml(...html: string[]) {
        this.active = true

        const content = document.querySelector("contents") as HTMLDivElement
        if (this.page != undefined) {
            content.innerHTML = this.page + (html.join() ?? "")
            return
        }

        return await fetch(this.url)
            .then(response => { return response.text(); })
            .then(data => {
                this.page = data;
                content.innerHTML = this.page + (html.join() ?? "")
            })
    }
    ReleaseHtml() {
        this.active = false
        const content = document.querySelector("contents") as HTMLDivElement
        if (content.hasChildNodes()) {
            content.replaceChildren()
        }
    }
    async execute(key: string) {
        const beforePageObj = this.CurrentPage
        if (beforePageObj != undefined) {
            beforePageObj.Release();
        }

        this.CurrentPage = this.cardMap[key]
        if (this.CurrentPage != undefined) {
            await this.CurrentPage.Run();
        }
    }
    resize() {
        const current = document.querySelector('.card-box[style*="display: block"]');
        const type = current?.getAttribute('data-card') || 'blockchain';
        this.showCard(type);
    }

    isMobile() { return window.innerWidth < 768 }

    async showCard(type: string) {
        document.querySelectorAll('.card-box').forEach((card) => {
            const isMatch = card.getAttribute('data-card') === type;
            if (this.isMobile()) {
                (card as HTMLElement).style.display = isMatch ? 'block' : 'none';
            } else {
                (card as HTMLElement).style.display = 'block';
            }
            const fade = card.querySelector('.fade-slide');
            if (isMatch || !this.isMobile()) {
                this.execute(card.id);
                setTimeout(() => { fade?.classList.add('show') }, 100);
            } else {
                fade?.classList.remove('show');
            }
        });
    }
}