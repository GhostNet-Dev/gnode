export enum GPType {
    DHTStoreSq,
    DHTStoreCq,
    DHTLookupSq,
    DHTLookupCq,

    TransactionSq,
    TransactionCq,
}
export type GPacket = {
    type: GPType,
    key: string,
    value: any,
}