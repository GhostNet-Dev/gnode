import { Channel } from "./provider";

const ch = new Channel()
console.log("Hello from Electron Renderer");
document.body.innerHTML = "<h1>Hello, Electron!</h1>";

