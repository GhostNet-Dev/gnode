import { Chart } from "chart.js";
import RendererFactory from "./factory";
import { Base } from "@GBlibs/webs/views/base";

declare global {
    interface Window {
        showCard(type: string): void
    }
}
const fab = new RendererFactory()

const start = async () => {
    await fab.Initialize()

    const base = new Base("./", fab.Build())

    base.Initialize()
    base.showCard('blockchain');
    window.showCard = (type: string) => base.showCard(type)
    window.addEventListener('resize', () => {
        base.resize()
    });
}

window.addEventListener('DOMContentLoaded', () => {
    start()
});


