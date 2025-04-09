import Page from "./page";

export default class Card extends Page {
    constructor(url: string, private id: string, private title: string) {
        super(url, { preload: false })
    }

    async LoadHtml(...html: string[]) {
        this.active = true

        const content = document.getElementById(this.id) as HTMLDivElement
        if (this.page != undefined) {
            content.innerHTML = this.page + (html.join() ?? "")
            return
        }

        return await fetch(this.url)
            .then(response => { return response.text(); })
            .then(data => {
                this.page = `
                <div class="card fade-slide p-3 shadow">
                <h5 class="card-title">${this.title}</h5>
                ${data}
                </div>`
                content.innerHTML = this.page + (html.join() ?? "")
            })
    }
}
