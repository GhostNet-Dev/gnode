import Peer, { DataConnection } from "peerjs";
import { v4 as uuidv4 } from "uuid"
import { peerConfig } from "./peer";
import { GPType, GPacket } from "./packet";
import { logger } from "@GBlibs/logger/logger";

/**
 * PeerJS 기반 DHT 네트워크
 */
export default class DHTPeer {
    peer: Peer;
    peers: Map<string, DataConnection>; // 연결된 Peer 목록
    private keyValueStore: Map<string, string>; // DHT 저장소
    private handler: Function[] = []
    private clients: Function[][] = []
    id = uuidv4()

    constructor(peerId?: string) {
        const id = "GhostNet:" + ((peerId) ? peerId : this.id)
        this.peer = new Peer(id, { config: peerConfig });
        this.peers = new Map();
        this.keyValueStore = new Map();
        this.initHandler()
        this.setupPeerEvents();
        logger.info("node id = " + id)
    }

    /**
     * PeerJS 이벤트 설정
     */
    private setupPeerEvents() {
    
        this.peer.on('open', (id) => {
            logger.info(`Peer ID: ${id}`);
        });

        this.peer.on('connection', (conn) => {
            logger.info(`Connected to: ${conn.peer}`);
            this.peers.set(conn.peer, conn);

            conn.on('open', () => {
                logger.info(`🔗 PeerJS Connection Established with ${conn.peer}`);

                // WebRTC 연결 상태 확인
                conn.peerConnection.oniceconnectionstatechange = () => {
                    logger.info(`🔍 ICE Connection State: ${conn.peerConnection.iceConnectionState}`);
                };
            });

            conn.on('data', (data) => this.handleIncomingData(data as GPacket, conn));
            conn.on('close', () => {
                logger.info(`Disconnected from: ${conn.peer}`);
                this.peers.delete(conn.peer);
            });
        });
    }

    /**
     * 다른 Peer에 연결
     */
    connectToPeer(peerId: string) {
        if (this.peers.has(peerId)) return;

        const conn = this.peer.connect(peerId);
        conn.on('open', () => {
            logger.info(`Connected to ${peerId}`);
            this.peers.set(peerId, conn);
        });

        conn.on('data', (data) => this.handleIncomingData(data as GPacket, conn));
        conn.on('close', () => {
            logger.info(`Disconnected from: ${peerId}`);
            this.peers.delete(peerId);
        });
    }

    /**
     * DHT 데이터 저장 (가장 가까운 노드에 저장)
     */
    storeData(key: string, value: string) {
        const closestPeer = this.findClosestPeer(key);
        if (closestPeer) {
            this.peers.get(closestPeer)?.send({ type: 'store', key, value });
        } else {
            // 직접 저장 (자신이 가장 가까운 노드일 경우)
            this.keyValueStore.set(key, value);
            logger.info(`Stored Locally - Key: ${key}, Value: ${value}`);
        }
    }

    /**
     * DHT 데이터 검색 (가장 가까운 노드에 요청)
     */
    lookupData(key: string) {
        if (this.keyValueStore.has(key)) {
            logger.info(`Data Found Locally - Key: ${key}, Value: ${this.keyValueStore.get(key)}`);
            return this.keyValueStore.get(key);
        }

        const closestPeer = this.findClosestPeer(key);
        if (closestPeer) {
            this.peers.get(closestPeer)?.send({ type: 'lookup', key });
        } else {
            logger.info(`Data Not Found for Key: ${key}`);
        }
    }

    /**
     * XOR 거리 기반으로 가장 가까운 노드 찾기
     */
    private findClosestPeer(key: string): string | null {
        let closestPeer: string | null = null;
        let minDistance = Infinity;

        this.peers.forEach((_, peerId) => {
            const distance = this.xorDistance(peerId, key);
            if (distance < minDistance) {
                minDistance = distance;
                closestPeer = peerId;
            }
        });

        return closestPeer;
    }

    /**
     * XOR 거리 계산
     */
    private xorDistance(a: string, b: string): number {
        const hashA = parseInt(a, 16);
        const hashB = parseInt(b, 16);
        return hashA ^ hashB;
    }
    /**
     * 들어오는 메시지 처리
     */
    RegisterListener(type: GPType, func: Function) {
        if(!this.clients[type]) {
            this.clients[type] = [func]
        } else {
            this.clients[type].push(func)
        }
    }
    private handleIncomingData(data: GPacket, conn: DataConnection) {
        const h = this.handler[data.type](data, conn)
        if(h) h(data, conn)
        else {
            this.clients[data.type]?.forEach((c) => {
                c(data, conn)
            })
        }
    }
    private initHandler() {
        this.handler[GPType.DHTLookupSq] = (data: GPacket, conn: DataConnection) => {
            if (this.keyValueStore.has(data.key)) {
                conn.send({ type: GPType.DHTLookupCq, key: data.key, value: this.keyValueStore.get(data.key) });
            } else {
                const closestPeer = this.findClosestPeer(data.key);
                if (closestPeer) {
                    this.peers.get(closestPeer)?.send(data);
                }
            }
        }
        this.handler[GPType.DHTLookupCq] = (data: GPacket, conn: DataConnection) => {
            logger.info(`Lookup Response - Key: ${data.key}, Value: ${data.value}`);
            this.clients[GPType.DHTLookupCq].forEach((c) => {
                c(data, conn)
            })
        }
        this.handler[GPType.DHTStoreSq] = (data: GPacket, conn: DataConnection) => {
            this.keyValueStore.set(data.key, data.value);
            logger.info(`Received and Stored - Key: ${data.key}, Value: ${data.value}`);
        }
    }
}
