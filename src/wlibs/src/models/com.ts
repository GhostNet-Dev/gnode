
export interface Channel {
    RegisterMsgHandler(eventName: string, params: any): void;
    SendMsg(eventName: string, ...params: any[]): void;
}