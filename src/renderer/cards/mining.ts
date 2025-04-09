import { IChannel } from "@Commons/icom";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Filler
} from 'chart.js';
import { RouteType } from "../../types/routetypes";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Filler
);

export default class Mining extends Card implements IPage {
    constructor(private ch: IChannel) {
        super("html/mining.html", "mininginfo", "Mining Statics")
        this.ch.RegisterMsgHandler(RouteType.LoadKeysRes, (ret: boolean) => {
            console.log(ret)
        })
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.ch.SendMsg(RouteType.LoadKeysReq, "test", "testpass")
        return false
    }
    async LoadHtml() {
        await super.LoadHtml()
        const ctx = document.getElementById('miningChart') as HTMLCanvasElement;
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['월', '화', '수', '목', '금', '토', '일'],
                    datasets: [{
                        label: '채굴 수익 (XYZ)',
                        data: [0.4, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2],
                        fill: true,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
}
