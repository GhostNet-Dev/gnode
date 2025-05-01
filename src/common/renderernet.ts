import { INetworkInterface } from "@GBlibs/network/inetwork";
import { IChannel } from "./icom";

export class RendererNet {
    ch?: IChannel
    net?: INetworkInterface
    StartPeer(ch: IChannel, net: INetworkInterface) {
        this.ch = ch
        this.net = net
    }
}