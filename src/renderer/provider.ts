import { IChannel } from "@Commons/icom";

let Channel: new () => IChannel;

// 환경 감지
if (typeof window !== "undefined" && (window as any).process && (window as any).process.type) {
    // Electron 환경
    Channel = require("../main/ipc").Ipc;
} else {
    // Web 환경
    Channel = require("../server/wsocket").Socket;
}

export { Channel };

