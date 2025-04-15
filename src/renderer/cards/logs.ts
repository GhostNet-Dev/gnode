import { IChannel } from "@Commons/icom";
import Card from "@Webs/views/card";
import { IPage } from "@Webs/views/page";
import { RouteType } from "../../types/routetypes";
import Sessions from "@Webs/sessions/session";
import { LogBuffer } from "@GBlibs/logger/logger";

export default class LogCard extends Card implements IPage {
    constructor(private ch: IChannel, private sess: Sessions) {
        super("html/logs.html", "loginfo", "Log View")
        ch.RegisterMsgHandler(RouteType.GetLogsRes, (logs: LogBuffer[]) => {
            let html = ``
            for (let i = logs.length - 1; i >= 0 ; i--) {
                const log = logs[i]
                html += `
                <div class="row border-top">
                    <div class="col">${log.time} [${log.level}] (${log.location}): ${log.message}</div>
                </div> 
                `
            }
            const domNodeCnt = document.getElementById("loglist")
            if (domNodeCnt) domNodeCnt.innerHTML = html
        })
    }
    Release(): void {
    }
    async Run(): Promise<boolean> {
        this.ch.SendMsg(RouteType.GetLogsReq)
        return false
    }
    formatDateToCustomString(date: Date): string {
        const yy = String(date.getFullYear()).slice(-2); // '25'
        const MM = String(date.getMonth() + 1).padStart(2, '0'); // '04'
        const dd = String(date.getDate()).padStart(2, '0'); // '15'
        const hh = String(date.getHours()).padStart(2, '0'); // '00'
        const mm = String(date.getMinutes()).padStart(2, '0'); // '12'
        const ss = String(date.getSeconds()).padStart(2, '0'); // '33'

        return `${yy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
    }
}
