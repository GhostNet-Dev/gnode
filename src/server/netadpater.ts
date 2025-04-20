import { Handler } from "@Commons/icom";
import { NetworkInterface } from "../libs/src/network/inetwork";
import { RouteType } from "../types/routetypes";
import { WebSocket } from "ws";

export class NetAdapter implements NetworkInterface {
    private eventListeners = new Map<string, ((data: any) => void)[]>;
    private onceListeners = new Map<string, ((data: any) => void)>;
    constructor(private ws: WebSocket, private g_handler: Handler) { 
        this.setSocket(ws, g_handler)
    }
    setSocket(ws: WebSocket, g_handler: Handler) {
        this.ws = ws
        this.g_handler = g_handler
        g_handler[RouteType.PeerRes] = (ws: WebSocket, event: string, data: any[]) => {
            this.triggerEvent(event, data)
        }
    }
    private triggerEvent(event: string, data: any) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event)?.forEach((listener) => listener(data));
        }

        if (this.onceListeners.has(event)) {
            this.onceListeners.get(event)?.(data);
            this.onceListeners.delete(event);
        }
    }
    sendMessage(event: string, data: any): void {
        this.ws!.send(JSON.stringify({ types: RouteType.PeerReq, params: { event, data } }));
    }
    on(event: string, listener: (data: any) => void) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(listener);
        this.ws?.send(JSON.stringify({ types: RouteType.PeerOnReg, params: event }))
    }

    once(event: string, listener: (data: any) => void) {
        this.onceListeners.set(event, listener);
        this.ws?.send(JSON.stringify({ types: RouteType.PeerOnceReg, params: event }))
    }
}

