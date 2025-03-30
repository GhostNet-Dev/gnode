import { IChannel } from "@Commons/icom";
import { ipcRenderer } from "electron"; // ES import 

export default class Ipc implements IChannel {
    token = ""
    public RegisterMsgHandler(eventName: string, params: any) {
        ipcRenderer.on(eventName, (_: any, args: any) => {
            params(args)
        });
    }

    public SendMsg(eventName: string, ...params: any[]) {
        ipcRenderer.send(eventName, ...params);
    }
    SetSession(token: string) {
        this.token = token
    }
}