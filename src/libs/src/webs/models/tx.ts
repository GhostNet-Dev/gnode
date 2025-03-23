export const enum TxOutputType {
    None= 0,
    TxTypeCoinTransfer,
    TxTypeDataStore,
    TxTypeFSRoot,
    TxTypeContract,
    TxTypeShare,
    TxTypeScript,
    TxTypeScriptStore,
}

//export type TxOutputType = typeof TxOutputType[keyof typeof TxOutputType];
export const TxOutputTypeStr: { [key in TxOutputType]?: string } = {
    [TxOutputType.None]: "None",
    [TxOutputType.TxTypeCoinTransfer]: "Coin",
    [TxOutputType.TxTypeDataStore]: "Data",
    [TxOutputType.TxTypeFSRoot]: "Account",
    [TxOutputType.TxTypeContract]: "Contract",
    [TxOutputType.TxTypeScript]: "Script",
    [TxOutputType.TxTypeScriptStore]: "Data from Script",
}

export type PrevOutputParam = {
    TxType: TxOutputType,
    VOutPoint: TxOutPoint,
    Vout: TxOutput
}

export type TxOutPoint = {
    TxId: string,
    TxOutIndex: string,
}

export type TxInput = {
    PrevOut: TxOutPoint,
    Sequence: string,
    ScriptSize: string,
    ScriptSig: string
}

export type TxOutput = {
    Addr: string,
    BrokerAddr: string,
    Type: TxOutputType,
    Value: string,
    ScriptSize: string,
    ScriptPubKey: string,
    ScriptExSize: string,
    ScriptEx: string
}

export type TxBody = {
    InputCounter: string,
    Vin: TxInput[],
    OutputCounter: string,
    Vout: TxOutput[],
    Nonce: string,
    LockTime: string,
}

export type GhostTransaction = {
    TxId: string,
    Body: TxBody,
}

export type GhostDataTransaction = {
    TxId: string,
    LogicalAddress: string,
    DataSize: string,
    Data: string
}