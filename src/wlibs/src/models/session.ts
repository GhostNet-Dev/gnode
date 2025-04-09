/*import { BlockStore } from "../store";
import { Channel } from "./com.js";

const jsSessionKey = "GhostStudio"

export class Session {
    m_signinFlag: boolean
    m_blockStore:BlockStore
    m_id: string
    m_pw: string
    m_pubKey: string
    m_rawPubKey: string
    m_term: any
    m_ipc: Channel

    public constructor(private blockStore: BlockStore, term: any, ipc: Channel) {
        this.m_signinFlag = false;
        this.m_blockStore = blockStore;
        this.m_id = this.m_pw = this.m_pubKey = this.m_rawPubKey = "";
        this.m_term = term;
        this.m_ipc = ipc;
  
        ipc.RegisterMsgHandler('executeProcessExit', (code:number) => {
            this.SignOut()
            window.ClickLoadPage("main", false);
        });
        ipc.RegisterMsgHandler('gwsout', (data: any) => {
            if (this.m_term == null) { return; }
            this.m_term.write(data);
        });
        ipc.RegisterMsgHandler('gwserr', (data: any) => {
            if (this.m_term == null) { return; }
            this.m_term.write(data);
        });
        ipc.RegisterMsgHandler('close', () => {
            //window.location.replace("http://" + location.host)
        });
        this.Restore()
    }
    public Restore() {
        const str = sessionStorage.getItem(jsSessionKey)
        if (str != null && this.m_signinFlag == false) {
            console.log(str)
            const user = JSON.parse(str)
            this.m_id = user.id
            this.m_pw = user.pw
            this.m_pubKey = user.pubKey
            this.m_rawPubKey = user.rawPubkey
            this.m_signinFlag = true;
        }
    }
    public SessionCheck() {
        const btn = document.getElementById("logoutlink") as HTMLAnchorElement
        btn.onclick = () => {
            this.SignOut()
        }
    }

    public SignIn(id: string, pw: string, pubkey: string, port: string) {
        this.m_id = id;
        this.m_pw = pw;
        this.m_pubKey = pubkey;
        this.m_signinFlag = true;
        
        this.m_ipc.SendMsg('executeProcess', './bins/' + this.m_blockStore.GetGWSPath(),
            this.m_id, this.m_pw, port);

        this.m_blockStore.MasterAddr = "http://" + location.hostname + ":58080"
        console.log(this.m_blockStore.MasterAddr)
        this.m_blockStore.RequestAccountbyNick(id)
            .then((res) => this.m_rawPubKey = res)
            .then(() => {
                sessionStorage.setItem(jsSessionKey, JSON.stringify({
                    id: this.m_id, pw: this.m_pw, pubKey: this.m_pubKey, rawPubkey: this.m_rawPubKey
                }))
            })
    }
    public SignOut() {
        this.m_id = this.m_pw = this.m_pubKey = ""
        this.m_signinFlag = false
        sessionStorage.removeItem(jsSessionKey)
        location.reload()
    }
    
    public GetId(): string { return this.m_id; }
    public GetPubAddress(): string { return this.m_pubKey }
    public GetPubKey(): string { return this.m_rawPubKey }

    public CheckLogin(): boolean {
        return this.m_signinFlag;
    } 
}
*/