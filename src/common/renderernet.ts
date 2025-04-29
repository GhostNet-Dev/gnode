import { NetworkInterface } from "@GBlibs/network/inetwork";
import { IChannel } from "./icom";
import { RouteType } from "../types/routetypes";

export class RendererNet {
    ch?: IChannel
    net?: NetworkInterface
    StartPeer(ch: IChannel, net: NetworkInterface) {
        this.ch = ch
        this.net = net

        this.ch.RegisterMsgHandler(RouteType.PeerReq, (data: any) => {
            this.net!.sendMessage(data.event, data.data)
        })
        this.ch.RegisterMsgHandler(RouteType.PeerOnReg, (e: any) => {
            net.on(e.event as string, (data: any) => {
                this.ch!.SendMsg(RouteType.PeerRes, e.event, data)
            })
        })
        this.ch.RegisterMsgHandler(RouteType.PeerOnceReg, (e: any) => {
            net.on(e.event as string, (data: any) => {
                this.ch!.SendMsg(RouteType.PeerRes, e.event, data)
            })
        })
        this.ch.SendMsg(RouteType.PeerStart)
    }
}