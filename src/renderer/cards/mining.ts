import { IChannel } from "@Commons/icom";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, Title, CategoryScale, Tooltip, Filler
} from 'chart.js';
import { RouteType } from "../../types/routetypes";
import Sessions from "@Webs/sessions/session";
import { Block } from "@GBlibs/blocks/blocktypes";

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Filler);

export default class Mining extends Card implements IPage {
    private chart?: Chart;
    private blockData: { date: string, count: number }[] = [];

    constructor(private ch: IChannel, private sess: Sessions) {
        super("html/mining.html", "mininginfo", "Mining Statics");

        // 날짜별 블록 수 수신 핸들러
        this.ch.RegisterMsgHandler(RouteType.GetBlockRes, (data: Record<string, Block[]>) => {
            const dateStr = Object.keys(data)[0];
            const count = data[dateStr]?.length ?? 0;
            this.blockData.push({ date: dateStr, count });

            if (this.blockData.length === 7) {
                // 날짜 오름차순 정렬
                this.blockData.sort((a, b) => a.date.localeCompare(b.date));
                this.updateChart(this.blockData);
            }
        });
    }

    Release(): void {
        if (this.chart) {
            this.chart.destroy();
            this.chart = undefined;
        }
    }

    async Run(): Promise<boolean> {
        this.blockData = [];
        const today = new Date();

        // 최근 7일 요청
        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - i);

            const d = {
                year: targetDate.getFullYear(),
                month: targetDate.getMonth() + 1,
                day: targetDate.getDate(),
                token: this.sess.getToken()
            };

            this.ch.SendMsg(RouteType.GetBlockReq, d.year, d.month, d.day, d.token);
        }

        return false;
    }

    async LoadHtml() {
        await super.LoadHtml();
    }

    private updateChart(data: { date: string, count: number }[]) {
        const ctx = document.getElementById('miningChart') as HTMLCanvasElement;
        if (!ctx) return;

        const labels = data.map(d => d.date.slice(5)); // 'MM-DD' 형태로 간략화
        const counts = data.map(d => d.count);

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Block 생성 수',
                    data: counts,
                    fill: true,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.3)',
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

