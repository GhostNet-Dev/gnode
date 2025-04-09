import { GhostNetBlockHeader, GhostNetDataBlockHeader } from "./block.js";
import { GhostTransaction } from "./tx.js";

export type FileInfo = {
    filename: string,
    filesize: number,
}

export type BlockInfoParam = {
    Header: GhostNetBlockHeader,
    DataHeader: GhostNetDataBlockHeader,
    IssuedCoin: number
}

export type AccountParam = {
    Nickname: string,
    PubKey: string,
    Coin: number
}

export type TxInfoParam = {
    BlockId: number,
    Tx: GhostTransaction
}

export type GhostIp = {
    Ip: string,
    Port: string
}

export type GhostNetUser = {
    MasterPubKey: string,
    PubKey: string,
    Nickname: string,
    ip: GhostIp,
}

export type GhostWebUser = {
    User: GhostNetUser,
    WebPort: string,
}
export type FetchResult = {
    result: string
}
export type JsonFetchResult = {
    json: string
}
