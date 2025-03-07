import { IChannel } from "@Commons/icom";
import { ipcRenderer } from "electron"; // ES import 

export class Ipc implements IChannel {
    public RegisterMsgHandler(eventName: string, params: any) {
        ipcRenderer.on(eventName, (_: any, args: any) => {
            params(args)
        });
    }

    public SendMsg(eventName: string, ...params: any[]) {
        ipcRenderer.send(eventName, ...params);
    }
}