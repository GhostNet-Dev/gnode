import Peer, { DataConnection } from "peerjs";
import { v4 as uuidv4 } from "uuid"
import { peerConfig } from "./peer";
import { GPType, GPacket } from "./packet";

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

    constructor(peerId?: string, private url: string = "https://ghostwebservice.com") {
        const id = "GhostNet-" + ((peerId) ? peerId : this.id)
        this.peer = new Peer(id, { config: peerConfig });
        this.peers = new Map();
        this.keyValueStore = new Map();
        this.initHandler()
        this.setupPeerEvents();
        this.id = id
        console.log("node id = " + id)
    }
    async fetchRoots() {
        const response = await fetch(this.url + '/json/validators.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch validators: ${response.statusText}`);
        }

        const data = await response.json();
        const roots = data.validators as any[];
        roots.forEach((r: any) => {
            const rootId = "GhostNet-" + r.publicKey
            if (rootId != this.id) {
                console.log("root connect = " + rootId + ", my id = " + this.id)
                this.connectToPeer(rootId)
            }
        })
    }
    /**
     * PeerJS 이벤트 설정
     */
    private setupPeerEvents() {
        this.peer.on("error", (err) => {
            console.error("❌ Peer 연결 오류:", err);
        });

        this.peer.on('open', (id) => {
            console.log(`Peer ID: ${id}`);
            this.fetchRoots()
        });

        this.peer.on('connection', (conn) => {
            console.log(`Connected to: ${conn.peer}`);
            this.peers.set(conn.peer, conn);

            conn.on('open', () => {
                console.log(`🔗 PeerJS Connection Established with ${conn.peer}`);

                // WebRTC 연결 상태 확인
                conn.peerConnection.oniceconnectionstatechange = () => {
                    console.log(`🔍 ICE Connection State: ${conn.peerConnection.iceConnectionState}`);
                };
            });

            conn.on('data', (data) => this.handleIncomingData(data as GPacket, conn));
            conn.on('close', () => {
                console.log(`Disconnected from: ${conn.peer}`);
                this.peers.delete(conn.peer);
            });
        });
    }

    /**
     * 다른 Peer에 연결
     */
    connectToPeer(peerId: string) {
        if (this.peers.has(peerId)) return;
        if (!this.peer || !this.peer.id) {
            console.error("❌ Peer 객체가 아직 초기화되지 않았습니다.");
            return;
        }

        const conn = this.peer.connect(peerId);
        if (!conn) {
            console.error(`❌ peer.connect(${peerId}) 실패: 반환값이 undefined입니다.`);
            return;
        }
        const timeout = setTimeout(() => {
            console.error(`❌ peer.connect(${peerId}) 실패: Timeout`);
            setTimeout(() => this.connectToPeer(peerId), 60000);
        }, 10_000);

        conn.on('open', () => {
            clearTimeout(timeout);
            console.log(`Connected to ${peerId}`);
            this.peers.set(peerId, conn);
        });

        conn.on('data', (data) => this.handleIncomingData(data as GPacket, conn));
        conn.on('close', () => {
            console.log(`Disconnected from: ${peerId}`);
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
            console.log(`Stored Locally - Key: ${key}, Value: ${value}`);
        }
    }

    /**
     * DHT 데이터 검색 (가장 가까운 노드에 요청)
     */
    lookupData(key: string) {
        if (this.keyValueStore.has(key)) {
            console.log(`Data Found Locally - Key: ${key}, Value: ${this.keyValueStore.get(key)}`);
            return this.keyValueStore.get(key);
        }

        const closestPeer = this.findClosestPeer(key);
        if (closestPeer) {
            this.peers.get(closestPeer)?.send({ type: 'lookup', key });
        } else {
            console.log(`Data Not Found for Key: ${key}`);
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
            console.log(`Lookup Response - Key: ${data.key}, Value: ${data.value}`);
            this.clients[GPType.DHTLookupCq].forEach((c) => {
                c(data, conn)
            })
        }
        this.handler[GPType.DHTStoreSq] = (data: GPacket, conn: DataConnection) => {
            this.keyValueStore.set(data.key, data.value);
            console.log(`Received and Stored - Key: ${data.key}, Value: ${data.value}`);
        }
    }
}
