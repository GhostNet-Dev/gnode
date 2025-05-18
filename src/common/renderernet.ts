import { INetworkInterface } from "@GBlibs/network/inetwork";
import { IChannel } from "./icom";
import DHTPeer from "@GBlibs/network/dhtpeer";
import GossipP2P from "@GBlibs/network/gossipp2p";

export class RendererNet {
    net?: INetworkInterface
    dataNet?: DHTPeer
    constructor(
        private ch: IChannel
    ) { }

    StartPeer(pubKey: string) {
        this.dataNet = new DHTPeer(pubKey)
        this.net = new GossipP2P(this.dataNet)
    }
}