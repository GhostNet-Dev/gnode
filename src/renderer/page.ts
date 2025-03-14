export interface IPage {
    Run(): Promise<boolean>
    Release(): void
}

export default class Page {
    page?: string
    active: boolean = false

    constructor(protected url: string) {}
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
}