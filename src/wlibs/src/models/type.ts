import { IPage } from "../views/page.js";
import { GhostWebUser } from "./param.js";

declare global {
    interface Window {
        MasterAddr: string;
        AdminMasterAddr: string;
        AdminAddr: string;
        MasterNode: GhostWebUser;
        NodeCount: number;
    }
}

export type FuncMap = { [key: string]: IPage };
export type CardMap = { [key: string]: IPage };

export type UserAccount = {
    id: string,
    pw: string,
    ip: string,
    port: string,
    wport: string,
}