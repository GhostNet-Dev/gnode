import { GhostTransaction, GhostDataTransaction } from "./tx.js"

export type SigHash = {
    DER: string,
    SignatureSize: string,
    RType: string,
    RSize: string,
    RBuf: string,
    SType: string,
    SSize: string,
    SBuf: string,
    SignatureType: string,
    PubKeySize: string,
    PubKey: string,
}

export type GhostNetDataBlockHeader = {
    Id: string,
    Version: string,
    PreviousBlockHeaderHash: string,
    MerkleRoot: string,
    Nonce: string,
    TransactionCount: string,
}

export type GhostNetBlockHeader = {
    Id: string,
    Version: string,
    PreviousBlockHeaderHash: string,
    MerkleRoot: string,
    DataBlockHeaderHash: string,
    TimeStamp: string,
    Bits: string,
    Nonce: string,
    AliceCount: string,
    TransactionCount: string,
    SignatureSize: string,
    BlockSignature: SigHash,
}

export type GhostNetDataBlock = {
    Header: GhostNetDataBlockHeader,
    Transaction: GhostDataTransaction[],
}

export type GhostNetBlock = {
    Header: GhostNetBlockHeader,
    Alice: GhostTransaction[],
    Transaction: GhostTransaction[]
}

export type PairedBlock = {
    Block: GhostNetBlock,
    DataBlock: GhostNetDataBlock
}