import { Base } from "@Webs/views/base";
import BootRenderFactory from "./bootfactory";

const fab = new BootRenderFactory()

const start = async () => {
    const base = new Base("./", fab.Build())
    await base.includeHTML("header", "navbar.html");
    // base.includeHTML("footer", "foot.html");
    base.includeContentHTML()
    window.ClickLoadPage = (key: string, fromEvent: boolean, ...args: string[]) => {
        base.ClickLoadPage(key, fromEvent, ...args)
    }
}

window.addEventListener('DOMContentLoaded', () => {
    start()
});


