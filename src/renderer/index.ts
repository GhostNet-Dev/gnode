import RendererFactory from "./factory";
import { Base } from "@GBlibs/webs/views/base";

const fab = new RendererFactory()

const start = async () => {
    await fab.Initialize()

    const base = new Base("./", fab.Build())
    base.includeHTML("header", "navbar.html");
    // base.includeHTML("footer", "foot.html");
    base.includeContentHTML()
    window.ClickLoadPage = (key: string, fromEvent: boolean, ...args: string[]) => {
        base.ClickLoadPage(key, fromEvent, ...args)
    }
}

window.addEventListener('DOMContentLoaded', () => {
    start()
});


