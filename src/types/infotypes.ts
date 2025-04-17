import { Validator } from "@GBlibs/consensus/validators"

export type AccountData = {
    addr: string,
    coins: number,
}

export type NetData = {
    peerAddrs: string[],
    validators: Validator[],
}