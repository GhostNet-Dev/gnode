import { FuncMap } from "../models/type"
import { IPage } from "./page"

export class Base {
    m_basePath: string
    beforPage: string
    funcMap: FuncMap
    CurrentPage?: IPage

    constructor(basePath: string, funcMap: FuncMap) {
        this.m_basePath = basePath
        
        this.beforPage = ""
        this.funcMap = funcMap
    }
    getPageIdParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const pageid = urlParams.get("pageid");
        const key = (pageid == null) ? "main" : pageid;
        if (this.beforPage == "") this.beforPage = key;
        return key;
    }
    public async ClickLoadPage(key: string, fromEvent: boolean, ...args: string[]) {
        //if (getPageIdParam() == key) return;

        const state = {
            'url': window.location.href,
            'key': key,
            'fromEvent': fromEvent,
            'args': args
        };
        console.log(`page change : ${this.beforPage} ==> ${key}`)
        this.beforPage = key;

        history.pushState(state, "login", "./?pageid=" + key + args)

        const beforePageObj = this.CurrentPage
        if (beforePageObj != undefined) {
            beforePageObj.Release();
        }

        this.CurrentPage = this.funcMap[key]
        if (this.CurrentPage != undefined) {
            await this.CurrentPage.Run();
        }

    };

    public includeHTML(id: string, filename: string) {
        return fetch(filename)
            .then(response => { return response.text(); })
            .then(data => { 
                const dom = document.querySelector(id) as HTMLDivElement
                if (dom) dom.innerHTML = data; 
            })
    }

    async includeContentHTML() {
        const key = this.getPageIdParam();
        this.beforPage = key;

        const beforePageObj = this.CurrentPage
        beforePageObj?.Release();

        this.CurrentPage = this.funcMap[key];
        await this.CurrentPage?.Run();
    }
    public Initialize() {
        this.includeHTML("header", "navbar.html");
        this.includeHTML("footer", "foot.html");
    }

    resize() {
        const current = document.querySelector('.card-box[style*="display: block"]');
        const type = current?.getAttribute('data-card') || 'blockchain';
        this.showCard(type);
    }

    isMobile() { return window.innerWidth < 768 }

    showCard(type: string) {
        document.querySelectorAll('.card-box').forEach((card) => {
            const isMatch = card.getAttribute('data-card') === type;
            if (this.isMobile()) {
                (card as HTMLElement).style.display = isMatch ? 'block' : 'none';
            } else {
                (card as HTMLElement).style.display = 'block';
            }
            const fade = card.querySelector('.fade-slide');
            if (isMatch || !this.isMobile()) {
                setTimeout(() => { 
                    console.log("show")
                    fade?.classList.add('show') 
                }, 100);
            } else {
                fade?.classList.remove('show');
            }
        });
}


}