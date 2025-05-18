import { createServer } from 'http';
import { parse } from 'url'
import path from "path"
import fs from 'fs'
import { readFile } from 'fs';
import { join } from 'path';
import { Mime } from "mime"
import { C2SMsg, Handler } from '@Commons/icom';
import { RouteType } from "../types/routetypes"
import BootFactory from '@Commons/bootfactory';
import { logger } from '@GBlibs/logger/logger';
import { WebSocket, WebSocketServer } from 'ws';
import { NetAdapter } from './netadpater';
import { Block } from '@GBlibs/blocks/blocktypes';
import { Transaction, UTXO } from '@GBlibs/txs/txtypes';

export const PORT = 3000;
const mime = new Mime()
const factory = new BootFactory()

// 정적 파일 서비스 (index.html)
const server = createServer((req, res) => {
    const parseUrl = parse(req.url || '/', true)
    const pathName = parseUrl.pathname
    if (pathName === '/' || pathName === '/index.html') {
        readFile(join(__dirname, '../../src/renderer/index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                logger.info(err)
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
            logger.info(err)
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    }
});

server.listen(PORT, () => {
    logger.info(`✅ Web Server running at http://localhost:${PORT}/`);
});


const wss = new WebSocketServer({ port: 3001 });
const g_handler: Handler = {
    [RouteType.LoadKeysReq]: async (ws: any, id: string, pass: string) => {
        const ret = await factory.route.LoadKeys(id, pass)
        ws.send(JSON.stringify({ types: RouteType.LoadKeysRes, params: ret }));
    },
    [RouteType.MakeAccountReq]: async (ws: any, id: string, pass: string) => {
        const ret = await factory.route.MakeAccount(id, pass)
        ws.send(JSON.stringify({ types: RouteType.MakeAccountRes, params: ret }));
    },
    [RouteType.AccountListReq]: async (ws: any) => {
        const ret = await factory.route.GetAcountList()
        ws.send(JSON.stringify({ types: RouteType.AccountListRes, params: ret }));
    },
    [RouteType.LoginReq]: async (ws: any, id: string, pass: string) => {
        const ret = await factory.route.Login(id, pass)
        logger.info(id, pass, ret)
        ws.send(JSON.stringify({ types: RouteType.LoginRes, params: ret }));
    },
    [RouteType.SessionCheckReq]: async (ws: any, token: string) => {
        const ret = await factory.route.SessionCheck(token)
        ws.send(JSON.stringify({ types: RouteType.SessionCheckRes, params: ret }));
    },
    [RouteType.AccountInfoReq]: async (ws: any, token: string) => {
        const ret = await factory.route.GetAccountInfo(token)
        ws.send(JSON.stringify({ types: RouteType.AccountInfoRes, params: ret }));
    },
    [RouteType.GetLogsReq]: async (ws: any) => {
        const ret = await factory.route.GetLogs()
        ws.send(JSON.stringify({ types: RouteType.GetLogsRes, params: ret }));
    },
    [RouteType.DbGetReq]: async (ws: any, id: string, dbname: string, key: string) => {
        const ret = await factory.route.getDBValue<any>(dbname, key)
        ws.send(JSON.stringify({ types: RouteType.DbRes, params: { id: id, res: ret } }));
    },
    [RouteType.DbPutReq]: async (ws: any, id: string, dbname: string, key: string, value: any) => {
        const ret = await factory.route.putDBValue<any>(dbname, key, value)
        ws.send(JSON.stringify({ types: RouteType.DbRes, params: { id: id, res: ret } }));
    },
    [RouteType.DbDelReq]: async (ws: any, id: string, dbname: string, key: string) => {
        const ret = await factory.route.delDBValue<any>(dbname, key)
        ws.send(JSON.stringify({ types: RouteType.DbRes, params: { id: id, res: ret } }));
    },
    [RouteType.DbIterReq]: async (ws: any, id: string, dbname: string, chunkSize: number) => {
        factory.route.streamDBChunks<any>(dbname, chunkSize, (chunk, done) => {
            ws.send(JSON.stringify({ types: RouteType.DbIterChunk, params: { id, chunk, done } }));
        })
    },
}
wss.on("connection", (ws: WebSocket) => {
    logger.info("connect");
    ws.on("message", (data: any) => {
        const msg: C2SMsg = JSON.parse(data);
        const h = g_handler[msg.types]
        if (!h) {
            logger.error("no handler", msg.types)
            return
        }
        logger.info(JSON.stringify(msg, null, 2))
        h(ws, ...msg.params);
    });
    ws.on("close", () => {
        logger.info("disconnect");
    });
    ws.onerror = function () {
        logger.info("error occurred");
    }
});

