import { createServer } from 'http';
import { readFile } from 'fs';
import { join } from 'path';

const PORT = 3000;

// 정적 파일 서비스 (index.html)
const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        readFile(join(__dirname, '../renderer/index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.url === '/client.js') {
        // 클라이언트 스크립트 서빙
        readFile(join(__dirname, '../renderer/index.js'), (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`✅ Web Server running at http://localhost:${PORT}/`);
});

