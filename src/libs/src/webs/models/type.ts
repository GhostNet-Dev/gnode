import { IPage } from "../views/page.js";
import { GhostWebUser } from "./param.js";

declare global {
    interface Window {
        ClickLoadPage: (key: string, from: boolean, ...arg: string[]) => void;
        MasterAddr: string;
        AdminMasterAddr: string;
        AdminAddr: string;
        MasterNode: GhostWebUser;
        NodeCount: number;
    }
}

export type FuncMap = { [key: string]: IPage };

export type UserAccount = {
    id: string,
    pw: string,
    ip: string,
    port: string,
    wport: string,
}