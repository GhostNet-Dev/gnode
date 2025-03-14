import Peer, { DataConnection } from "peerjs";
import { v4 as uuidv4 } from "uuid"

interface MessageData {
    type: 'message';
    message: string;
    sender: string;
}

interface PeersData {
    type: 'peers';
    peers: string[];
}

export const peerConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // 무료 Google STUN 서버
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        }, // 무료 TURN 서버
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        }, // 무료 TURN 서버
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        } // 무료 TURN 서버
    ]
}

type ReceivedData = MessageData | PeersData;

export default class p2p {
    id = uuidv4()
    peer: Peer
    connections: Record<string, DataConnection> = {}; // 다수의 연결을 저장할 객체
    constructor({ root = false }) {
        const id = (root) ? "" : this.id
        this.peer = new Peer(id, { config: peerConfig })
    }
    Init() {
        this.peer.on('open', (id) => {
            console.log(`My peer ID is: ${id}`);
        });

        // 새로 참가한 피어에게 기존 연결 정보 전달
        this.peer.on('connection', (conn: DataConnection) => {
            console.log(`Incoming connection from ${conn.peer}`);
            this.connections[conn.peer] = conn;

            // 새로 접속한 피어에게 기존 피어 목록 전달
            conn.send({ type: 'peers', peers: Object.keys(this.connections) });

            conn.on('data', (data: unknown) => {
                const receiveData = data as ReceivedData
                console.log(`Received from ${conn.peer}:`, data);

                // 메시지를 모든 피어에게 브로드캐스트
                if (receiveData.type === 'message') {
                    this.broadcastMessage(receiveData.message, conn.peer);
                }
            });

            conn.on('close', () => {
                console.log(`Connection with ${conn.peer} closed`);
                delete this.connections[conn.peer];
            });
        });
    }

    // 모든 연결된 피어에게 메시지 브로드캐스트
    broadcastMessage(message: string, sender: string) {
        Object.entries(this.connections).forEach(([peerId, conn]) => {
            if (peerId !== sender) {
                conn.send({ type: 'message', message, sender });
            }
        });
    }

    // 다른 피어에 연결 요청
    connectToPeer(peerId: string) {
        if (!this.connections[peerId]) {
            const conn = this.peer.connect(peerId);
            conn.on('open', () => {
                console.log(`Connected to ${peerId}`);
                this.connections[peerId] = conn;
            });

            conn.on('data', (data) => {
                const receiveData = data as ReceivedData
                console.log(`Received from ${peerId}:`, data);

                // 기존 피어 목록을 받으면 추가 연결
                if (receiveData.type === 'peers') {
                    receiveData.peers.forEach((id) => {
                        if (id !== this.peer.id) this.connectToPeer(id);
                    });
                } else if (receiveData.type === 'message') {
                    console.log(`Message from ${receiveData.sender}: ${receiveData.message}`);
                }
            });

            conn.on('close', () => {
                console.log(`Connection with ${peerId} closed`);
                delete this.connections[peerId];
            });
        }
    }
}
