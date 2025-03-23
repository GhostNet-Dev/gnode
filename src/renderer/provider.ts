import { IChannel } from "@Commons/icom";

let Channel: new (p: number) => IChannel;

if (typeof window !== "undefined" && (window as any).process?.type) {
    // Electron 환경
    Channel = eval('require')("../main/ipc").default;
} else {
    // Web 환경
    const mode = require("../libs/src/webs/network/wsocket");
    Channel = mode.default
}

export { Channel };

