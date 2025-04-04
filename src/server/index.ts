import { createServer } from 'http';
import { parse } from 'url'
import path from "path"
import fs from 'fs'
import { readFile } from 'fs';
import { join } from 'path';
import { Mime } from "mime"
import BlockChainFactory from '@Commons/bfactory';
import { C2SMsg, Handler } from '@Commons/icom';
import { RouteType } from "../types/routetypes"
const WebSocketServer = require('ws');

export const PORT = 3000;
const mime = new Mime()
const factory = new BlockChainFactory()

// 정적 파일 서비스 (index.html)
const server = createServer((req, res) => {
    const parseUrl = parse(req.url || '/', true)
    const pathName = parseUrl.pathname
    if (pathName === '/' || pathName === '/index.html') {
        readFile(join(__dirname, '../../src/renderer/index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                console.log(err)
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (pathName === '/client.js') {
        // 클라이언트 스크립트 서빙
        readFile(join(__dirname, '../../dist/renderer/index.js'), (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            }
        });
    } else {
        const url = req.url
        try {
            const type = mime.getType("." + url)
            if (type) res.setHeader("Content-Type", type)
            const file = fs.readFileSync(path.join(__dirname, "../../src/renderer", url ?? ""))
            res.writeHead(200)
            res.end(file)
        } catch (err) {
            console.log(err)
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    }
});

server.listen(PORT, () => {
    console.log(`✅ Web Server running at http://localhost:${PORT}/`);
});


const wss = new WebSocketServer.Server({ port: 3001 });
const g_handler: Handler = {
    [RouteType.LoadKeysReq]: async (ws: any, id: string, pass: string) => {
        const ret = await factory.route.LoadKeys(id, pass)
        ws.send(JSON.stringify({ types: RouteType.LoadKeysRes, params: ret }));
    },
    [RouteType.MakeAccountReq]: async (ws: any, id: string, pass: string) => {
        const ret = await factory.route.MakeAccount(id, pass)
        ws.send(JSON.stringify({ types: RouteType.LoadKeysRes, params: ret }));
    },
    [RouteType.AccountListReq]: async (ws: any) => {
        const ret = await factory.route.GetAcountList()
        ws.send(JSON.stringify({ types: RouteType.AccountListRes, params: ret }));
    },
    [RouteType.LoginReq]: async (ws: any, id: string, pass: string) => {
        const ret = await factory.route.Login(id, pass)
        console.log(id, pass, ret)
        ws.send(JSON.stringify({ types: RouteType.LoginRes, params: ret }));
    },
    [RouteType.SessionCheckReq]: async (ws: any, token: string) => {
        const ret = await factory.route.SessionCheck(token)
        ws.send(JSON.stringify({ types: RouteType.SessionCheckRes, params: ret }));
    },
}
wss.on("connection", (ws: any) => {
    console.log("connect");
    ws.on("message", (data: any) => {
        const msg: C2SMsg = JSON.parse(data);
        g_handler[msg.types](ws, ...msg.params);
    });
    ws.on("close", () => {
        console.log("disconnect");
    });
    ws.onerror = function () {
        console.log("error occurred");
    }
});

