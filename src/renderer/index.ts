import { Chart } from "chart.js";
import RendererFactory from "./factory";
import { Base } from "@GBlibs/webs/views/base";

declare global {
    interface Window {
        showCard(type: string): void
    }
}
console.log("Hello from Electron Renderer");

const start = async () => {
    const fab = new RendererFactory()
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

    // const ctx = document.getElementById('miningChart') as HTMLCanvasElement;
    // if (ctx) {
    //     new Chart(ctx, {
    //         type: 'line',
    //         data: {
    //             labels: ['월', '화', '수', '목', '금', '토', '일'],
    //             datasets: [{
    //                 label: '채굴 수익 (XYZ)',
    //                 data: [0.4, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2],
    //                 fill: true,
    //                 borderColor: 'rgb(75, 192, 192)',
    //                 backgroundColor: 'rgba(75, 192, 192, 0.2)',
    //                 tension: 0.3
    //             }]
    //         },
    //         options: {
    //             responsive: true,
    //             plugins: {
    //                 legend: { display: false }
    //             },
    //             scales: {
    //                 y: {
    //                     beginAtZero: true
    //                 }
    //             }
    //         }
    //     });
    // }
});


