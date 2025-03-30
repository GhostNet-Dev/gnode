export type Handler = { [key: string]: Function }
export type S2CMsg = { types: string, params: any }
export type C2SMsg = { types: string, params: any[] }

export interface IChannel {
    RegisterMsgHandler(eventName: string, params: any): void;
    SendMsg(eventName: string, ...params: any[]): void;
    SetSession(token: string): void;
}