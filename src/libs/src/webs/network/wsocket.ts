
export type Handler = { [key: string]: Function }
export type S2CMsg = { types: string, params: any }
export type C2SMsg = { types: string, params: any[] }

export default class Socket {
    m_opend = false
    m_ws!: WebSocket;
    m_handler: Handler;
    token = ""
    
    constructor(private port: number) {
        this.m_handler = {};
        this.Open(port)
    }
    Open(port: number) {
        this.m_ws = new WebSocket(`ws://${window.location.hostname}:${port}`);

        this.m_ws.onopen = () => {
            this.m_handler["open"]?.();
            this.m_opend = true;
            this.m_ws.onmessage = (evt) => {
                const msg: S2CMsg = JSON.parse(evt.data);
                switch (msg.types) {
                    case "gwserr":
                    case "gwsout":
                        break;
                    default:
                        console.log(evt.data);
                        break;
                }
                this.m_handler[msg.types](msg.params);
            }
            this.waitQ.forEach((m) => {
                this.SendMsg(m.eventName, ...m.params)
            })
        };
        this.m_ws.onclose = () => {
            this.m_opend = false
            this.m_handler["close"]?.();
        }
    }

    public RegisterMsgHandler(eventName: string, callback: any) {
        this.m_handler[eventName] = (params: any) => {
            callback(params);
        }
    }
    waitQ: { eventName: string, params: any[] }[] = []

    public SendMsg(eventName: string, ...params: any[]) {
        if(!this.m_opend) {
            this.waitQ.push({ eventName: eventName, params: params })
            this.Open(this.port)
            return
        }
        
        const msg: C2SMsg = {
            types: eventName,
            params: [...params, this.token],
        }
        this.m_ws.send(JSON.stringify(msg))
    }
    SetSession(token: string) {
        this.token = token
    }
}