export interface IPage {
    Run(): Promise<boolean>
    Release(): void
}

export class Page {
    page?: string
    active: boolean = false
    private alarm = document.getElementById("alarm-msg") as HTMLDivElement
    private alarmText = document.getElementById("alarm-msg-text") as HTMLDivElement

    private confirm = document.getElementById("globalConfirm") as HTMLDivElement
    private confirmText = document.getElementById("globalConfirmText") as HTMLDivElement
    private confirmBtn = document.getElementById("globalConfirmBtn") as HTMLButtonElement
    private cancelBtn = document.getElementById("globalCancelBtn") as HTMLButtonElement

    constructor(protected url: string) {}
    alarmOn(msg: string) {
        this.alarm.style.display = "block"
        this.alarmText.innerHTML = msg
    }
    alarmOff() {
        this.alarm.style.display = "none"
    }
    confirmOn(msg: string, yesBtn: string, yesFn: Function) {
        this.confirm.style.display = "block"
        this.confirmText.innerText = msg
        this.confirmBtn.innerText = yesBtn
        this.confirmBtn.onclick = () => { 
            this.confirm.style.display = "none"
            yesFn() 
        }
        this.cancelBtn.onclick = () => {
            this.confirm.style.display = "none"
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
}